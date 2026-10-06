import MockAdapter from "axios-mock-adapter";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import type { UserProfile } from "@/api/users";
import { ProfilePage } from "@/pages/account/ProfilePage";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";
import { renderRoutes } from "@/test/render-router";

const mock = new MockAdapter(apiClient);

const profile: UserProfile = {
  id: "user-1",
  email: "buyer@example.com",
  fullName: "Người mua",
  phone: "0901234567",
  address: "Hà Nội",
  role: "customer",
  shopName: null,
  pickupAddress: null,
};

const profileRoutes = [{ path: "/profile", element: <ProfilePage /> }];

function envelope<T>(data: T, message = "ok") {
  return { success: true, message, data };
}

describe("ProfilePage", () => {
  beforeEach(() => {
    mock.reset();
    useAuthStore.setState({ user: null, accessToken: null, refreshToken: null });
  });

  it("prefills the form from GET /users/me", async () => {
    mock.onGet("/users/me").reply(200, envelope(profile));
    renderRoutes(profileRoutes, "/profile");

    expect(await screen.findByLabelText("Họ và tên")).toHaveValue("Người mua");
    expect(screen.getByLabelText(/Số điện thoại/)).toHaveValue("0901234567");
    expect(screen.getByLabelText(/Địa chỉ/)).toHaveValue("Hà Nội");
    expect(screen.getByDisplayValue("buyer@example.com")).toBeInTheDocument();
  });

  it("sends only fullName, phone and address on PATCH", async () => {
    mock.onGet("/users/me").reply(200, envelope(profile));
    mock.onPatch("/users/me").reply(200, envelope({ ...profile, fullName: "Tên mới" }));
    renderRoutes(profileRoutes, "/profile");

    const user = userEvent.setup();
    const fullName = await screen.findByLabelText("Họ và tên");
    await user.clear(fullName);
    await user.type(fullName, "Tên mới");
    await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    await waitFor(() => expect(mock.history.patch).toHaveLength(1));
    const body = JSON.parse(mock.history.patch[0].data as string) as Record<string, string>;
    expect(body).toEqual({ fullName: "Tên mới", phone: "0901234567", address: "Hà Nội" });
    expect(await screen.findByText("Đã lưu hồ sơ")).toBeInTheDocument();
  });

  it("keeps the entered value and shows the field error when the server rejects it", async () => {
    mock.onGet("/users/me").reply(200, envelope(profile));
    mock.onPatch("/users/me").reply(400, {
      success: false,
      message: "Dữ liệu không hợp lệ",
      errors: [{ field: "fullName", message: "Họ và tên không hợp lệ" }],
    });
    renderRoutes(profileRoutes, "/profile");

    const user = userEvent.setup();
    const fullName = await screen.findByLabelText("Họ và tên");
    await user.clear(fullName);
    await user.type(fullName, "Tên mới");
    await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    expect(await screen.findByText("Họ và tên không hợp lệ")).toBeInTheDocument();
    expect(fullName).toHaveValue("Tên mới");
  });

  it("shows a Vietnamese retry message when saving has no server response", async () => {
    mock.onGet("/users/me").reply(200, envelope(profile));
    mock.onPatch("/users/me").networkError();
    renderRoutes(profileRoutes, "/profile");

    const user = userEvent.setup();
    const fullName = await screen.findByLabelText("Họ và tên");
    await user.clear(fullName);
    await user.type(fullName, "Tên mới");
    await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    expect(
      await screen.findByText("Không thể kết nối máy chủ. Vui lòng thử lại."),
    ).toBeInTheDocument();
  });
});
