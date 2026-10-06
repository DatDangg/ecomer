import * as yup from "yup";

export const profileSchema = yup.object({
  fullName: yup
    .string()
    .trim()
    .required("Vui lòng nhập họ và tên")
    .max(100, "Họ và tên tối đa 100 ký tự"),
  phone: yup.string().trim().max(20, "Số điện thoại tối đa 20 ký tự"),
  address: yup.string().trim().max(255, "Địa chỉ tối đa 255 ký tự"),
});

export type ProfileFormValues = yup.InferType<typeof profileSchema>;
