import { useEffect, useRef, useState, type RefObject } from "react";
import { useFormik, type FormikProps } from "formik";
import { useTranslation } from "react-i18next";

import type { UserProfile } from "@/api/users";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { profileSchema, type ProfileFormValues } from "@/features/profile/schemas";
import { useMyProfile, useUpdateProfile } from "@/features/profile/useProfile";
import { ApiRequestError } from "@/lib/api-client";
import { notifySuccess } from "@/lib/toast";
import { firstInvalidField, toFieldErrorsFromApi } from "@/lib/validation";

const FIELD_ORDER = ["fullName", "phone", "address"] as const;

function ProfileSkeleton() {
  const { t } = useTranslation();

  return (
    <section className="container-page py-8 md:py-12" aria-busy="true">
      <p className="sr-only" role="status">
        {t("profile.loading")}
      </p>
      <div className="mx-auto w-full max-w-2xl">
        <div className="h-8 w-48 animate-pulse rounded bg-surface motion-reduce:animate-none" />
        <div className="mt-6 flex flex-col gap-4">
          <div className="h-11 w-full animate-pulse rounded-md bg-surface motion-reduce:animate-none" />
          <div className="h-11 w-full animate-pulse rounded-md bg-surface motion-reduce:animate-none" />
          <div className="h-11 w-full animate-pulse rounded-md bg-surface motion-reduce:animate-none" />
        </div>
      </div>
    </section>
  );
}

function ProfileErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();

  return (
    <section className="container-page py-8 md:py-12">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="font-heading font-medium">{t("profile.title")}</h1>
        <p role="alert" className="mt-4 text-base text-error">
          {t("profile.loadError")}
        </p>
        <Button type="button" variant="outline" className="mt-4" onClick={onRetry}>
          {t("profile.retry")}
        </Button>
      </div>
    </section>
  );
}

/** Owns profile form state, PATCH call, inline error mapping and first-error focus. */
function useProfileForm(profile: UserProfile) {
  const { t } = useTranslation();
  const update = useUpdateProfile();
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const fullNameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLTextAreaElement>(null);

  const formik = useFormik<ProfileFormValues>({
    initialValues: {
      fullName: profile.fullName,
      phone: profile.phone ?? "",
      address: profile.address ?? "",
    },
    enableReinitialize: true,
    validationSchema: profileSchema,
    onSubmit: async (values) => {
      setFormError(null);
      setSaved(false);
      try {
        await update.mutateAsync({
          fullName: values.fullName.trim(),
          phone: (values.phone ?? "").trim(),
          address: (values.address ?? "").trim(),
        });
        setSaved(true);
        notifySuccess(t("profile.saved"));
      } catch (error) {
        const apiError = error instanceof ApiRequestError ? error : null;
        if (apiError?.errors?.length) {
          formik.setErrors(toFieldErrorsFromApi(apiError.errors));
          return;
        }
        setFormError(apiError?.message ?? t("profile.saveError"));
      }
    },
  });

  useEffect(() => {
    if (formik.submitCount === 0) return;
    const field = firstInvalidField(formik.errors, FIELD_ORDER);
    if (field === "fullName") fullNameRef.current?.focus();
    if (field === "phone") phoneRef.current?.focus();
    if (field === "address") addressRef.current?.focus();
  }, [formik.submitCount, formik.errors]);

  return { formik, formError, saved, update, fullNameRef, phoneRef, addressRef };
}

function ProfileEmailField({ email }: { email: string }) {
  const { t } = useTranslation();

  return (
    <FormField id="profile-email" label={t("profile.emailLabel")} hint={t("profile.emailHint")}>
      <Input
        id="profile-email"
        name="email"
        type="email"
        value={email}
        readOnly
        aria-readonly="true"
        className="bg-surface"
      />
    </FormField>
  );
}

interface ProfileFieldsProps {
  formik: FormikProps<ProfileFormValues>;
  fullNameRef: RefObject<HTMLInputElement>;
  phoneRef: RefObject<HTMLInputElement>;
}

function ProfileFields({ formik, fullNameRef, phoneRef }: ProfileFieldsProps) {
  const { t } = useTranslation();
  const fullNameError = formik.touched.fullName ? formik.errors.fullName : undefined;
  const phoneError = formik.touched.phone ? formik.errors.phone : undefined;

  return (
    <>
      <FormField id="fullName" label={t("profile.fullNameLabel")} error={fullNameError}>
        <Input
          ref={fullNameRef}
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          value={formik.values.fullName}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          aria-invalid={Boolean(fullNameError)}
          aria-describedby={fullNameError ? "fullName-error" : undefined}
        />
      </FormField>

      <FormField id="phone" label={t("profile.phoneLabel")} optional error={phoneError}>
        <Input
          ref={phoneRef}
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={formik.values.phone}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          aria-invalid={Boolean(phoneError)}
          aria-describedby={phoneError ? "phone-error" : undefined}
        />
      </FormField>
    </>
  );
}

interface ProfileAddressFieldProps {
  formik: FormikProps<ProfileFormValues>;
  addressRef: RefObject<HTMLTextAreaElement>;
}

function ProfileAddressField({ formik, addressRef }: ProfileAddressFieldProps) {
  const { t } = useTranslation();
  const addressError = formik.touched.address ? formik.errors.address : undefined;

  return (
    <FormField id="address" label={t("profile.addressLabel")} optional error={addressError}>
      <textarea
        ref={addressRef}
        id="address"
        name="address"
        autoComplete="street-address"
        rows={3}
        value={formik.values.address}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        aria-invalid={Boolean(addressError)}
        aria-describedby={addressError ? "address-error" : undefined}
        className="flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
      />
    </FormField>
  );
}

function ProfileForm({ profile }: { profile: UserProfile }) {
  const { t } = useTranslation();
  const { formik, formError, saved, update, fullNameRef, phoneRef, addressRef } =
    useProfileForm(profile);

  return (
    <section className="container-page py-8 md:py-12">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="font-heading font-medium">{t("profile.title")}</h1>
        <p className="mt-2 text-base text-muted-foreground">{t("profile.intro")}</p>

        <form noValidate onSubmit={formik.handleSubmit} className="mt-6 flex flex-col gap-5">
          {saved ? <FormAlert tone="success">{t("profile.saved")}</FormAlert> : null}
          {formError ? <FormAlert tone="error">{formError}</FormAlert> : null}

          <ProfileEmailField email={profile.email} />
          <ProfileFields formik={formik} fullNameRef={fullNameRef} phoneRef={phoneRef} />
          <ProfileAddressField formik={formik} addressRef={addressRef} />

          <Button type="submit" disabled={update.isPending} className="w-full sm:w-auto">
            {update.isPending ? t("profile.saving") : t("profile.save")}
          </Button>
        </form>
      </div>
    </section>
  );
}

export function ProfilePage() {
  const profileQuery = useMyProfile();

  if (profileQuery.isLoading) {
    return <ProfileSkeleton />;
  }

  if (profileQuery.isError || !profileQuery.data) {
    return <ProfileErrorState onRetry={() => void profileQuery.refetch()} />;
  }

  return <ProfileForm profile={profileQuery.data} />;
}
