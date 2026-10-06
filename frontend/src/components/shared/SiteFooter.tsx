import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function SiteFooter() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border bg-background">
      <div className="container-page flex flex-col gap-2 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <Link to="/" className="font-heading font-medium text-foreground">
          {t("app.name")}
        </Link>
        <p>{t("footer.tagline")}</p>
      </div>
    </footer>
  );
}
