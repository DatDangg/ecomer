import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

/**
 * Skeleton page used by the layer 0 router so every shell route resolves.
 * Real screens are implemented in later layers.
 */
export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  const { t } = useTranslation();

  return (
    <section className="container-page py-8 md:py-12">
      <h1 className="font-medium">{title}</h1>
      <p className="mt-3 max-w-2xl text-base text-muted-foreground">
        {description ?? t("common.comingSoon")}
      </p>
    </section>
  );
}

export function NotFoundPage() {
  return (
    <section className="container-page py-16 text-center md:py-24">
      <h1 className="font-medium">Không tìm thấy trang</h1>
      <p className="mx-auto mt-3 max-w-md text-base text-muted-foreground">
        Đường dẫn bạn truy cập không tồn tại hoặc đã bị thay đổi.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
      >
        Về trang chủ
      </Link>
    </section>
  );
}
