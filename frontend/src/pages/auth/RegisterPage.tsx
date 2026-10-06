import { useEffect, useRef, useState, type RefObject } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik, type FormikProps } from "formik";
import { useMutation } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { registerRequest } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { AuthLink } from "@/features/auth/AuthLink";
import { PasswordInput } from "@/features/auth/PasswordInput";
import { registerSchema, type RegisterFormValues } from "@/features/auth/schemas";
import { ApiRequestError } from "@/lib/api-client";
import { notifySuccess } from "@/lib/toast";
import { firstInvalidField, toFieldErrorsFromApi, type FieldErrors } from "@/lib/validation";

const FIELD_ORDER = ["fullName", "email", "password"] as const;

interface RegisterApiErrorResult {
  field?: "email";
  fieldMessage?: string;
  fieldErrors?: FieldErrors;
  formError?: string;
  emailConflict?: boolean;
}

/** Maps a registration failure to inline field error(s) or a form-level message. */
function mapRegisterApiError(error: unknown, t: TFunction): RegisterApiErrorResult {
  const apiError = error instanceof ApiRequestError ? error : null;

  if (apiError?.status === 409) {
    return {
      field: "email",
      fieldMessage: apiError.message || t("auth.emailInUse"),
      emailConflict: true,
    };
  }

  if (apiError?.errors?.length) {
    return { fieldErrors: toFieldErrorsFromApi(apiError.errors) };
  }

  if (apiError?.status === 429) {
    return { formError: t("auth.tooManyAttempts") };
  }

  return { formError: apiError?.message ?? t("auth.networkError") };
}

function applyRegisterApiError(
  formik: FormikProps<RegisterFormValues>,
  result: RegisterApiErrorResult,
  setEmailConflict: (value: boolean) => void,
  setFormError: (message: string | null) => void,
): void {
  if (result.fieldErrors) {
    formik.setErrors(result.fieldErrors);
  }
  if (result.field && result.fieldMessage) {
    formik.setFieldTouched(result.field, true, false);
    formik.setFieldError(result.field, result.fieldMessage);
  }
  setEmailConflict(result.emailConflict ?? false);
  setFormError(result.formError ?? null);
}

/** Owns register form state, API call, inline error mapping and first-error focus. */
function useRegisterForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const [emailConflict, setEmailConflict] = useState(false);
  const fullNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const register = useMutation({
    mutationFn: registerRequest,
    onSuccess: (_result, values) => {
      notifySuccess(t("auth.registerSuccess"));
      navigate("/login", { replace: true, state: { registered: true, email: values.email } });
    },
  });

  const formik = useFormik<RegisterFormValues>({
    initialValues: { fullName: "", email: "", password: "" },
    validationSchema: registerSchema,
    onSubmit: async (values) => {
      setFormError(null);
      setEmailConflict(false);
      try {
        await register.mutateAsync({ ...values, email: values.email.trim() });
      } catch (error) {
        applyRegisterApiError(formik, mapRegisterApiError(error, t), setEmailConflict, setFormError);
      }
    },
  });

  useEffect(() => {
    if (formik.submitCount === 0) return;
    const field = firstInvalidField(formik.errors, FIELD_ORDER);
    if (field === "fullName") fullNameRef.current?.focus();
    if (field === "email") emailRef.current?.focus();
    if (field === "password") passwordRef.current?.focus();
  }, [formik.submitCount, formik.errors]);

  return { formik, formError, emailConflict, register, fullNameRef, emailRef, passwordRef };
}

interface RegisterIdentityFieldsProps {
  formik: FormikProps<RegisterFormValues>;
  fullNameRef: RefObject<HTMLInputElement>;
  emailRef: RefObject<HTMLInputElement>;
}

interface RegisterPasswordFieldProps {
  formik: FormikProps<RegisterFormValues>;
  passwordRef: RefObject<HTMLInputElement>;
}

function RegisterIdentityFields({ formik, fullNameRef, emailRef }: RegisterIdentityFieldsProps) {
  const { t } = useTranslation();
  const fullNameError = formik.touched.fullName ? formik.errors.fullName : undefined;
  const emailError = formik.touched.email ? formik.errors.email : undefined;

  return (
    <>
      <FormField id="fullName" label={t("auth.fullNameLabel")} error={fullNameError}>
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

      <FormField id="email" label={t("auth.emailLabel")} error={emailError}>
        <Input
          ref={emailRef}
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={formik.values.email}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          aria-invalid={Boolean(emailError)}
          aria-describedby={emailError ? "email-error" : undefined}
        />
      </FormField>
    </>
  );
}

function RegisterPasswordField({ formik, passwordRef }: RegisterPasswordFieldProps) {
  const { t } = useTranslation();
  const passwordError = formik.touched.password ? formik.errors.password : undefined;

  return (
    <FormField
      id="password"
      label={t("auth.passwordLabel")}
      hint={t("auth.passwordHint")}
      error={passwordError}
    >
      <PasswordInput
        ref={passwordRef}
        id="password"
        name="password"
        value={formik.values.password}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        autoComplete="new-password"
        invalid={Boolean(passwordError)}
        describedBy={passwordError ? "password-hint password-error" : "password-hint"}
      />
    </FormField>
  );
}

interface RegisterFormProps {
  formik: FormikProps<RegisterFormValues>;
  formError: string | null;
  emailConflict: boolean;
  isPending: boolean;
  fullNameRef: RefObject<HTMLInputElement>;
  emailRef: RefObject<HTMLInputElement>;
  passwordRef: RefObject<HTMLInputElement>;
}

function RegisterForm({
  formik,
  formError,
  emailConflict,
  isPending,
  fullNameRef,
  emailRef,
  passwordRef,
}: RegisterFormProps) {
  const { t } = useTranslation();

  return (
    <form noValidate onSubmit={formik.handleSubmit} className="mt-6 flex flex-col gap-4">
      {formError ? <FormAlert tone="error">{formError}</FormAlert> : null}

      {emailConflict ? (
        <FormAlert tone="error">
          {t("auth.emailInUseAction")} <AuthLink to="/login">{t("auth.goToLogin")}</AuthLink>
        </FormAlert>
      ) : null}

      <RegisterIdentityFields formik={formik} fullNameRef={fullNameRef} emailRef={emailRef} />
      <RegisterPasswordField formik={formik} passwordRef={passwordRef} />

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? t("auth.registering") : t("auth.registerSubmit")}
      </Button>
    </form>
  );
}

export function RegisterPage() {
  const { t } = useTranslation();
  const { formik, formError, emailConflict, register, fullNameRef, emailRef, passwordRef } =
    useRegisterForm();

  return (
    <section className="container-page py-10 md:py-16">
      <div className="mx-auto w-full max-w-md">
        <h1 className="font-heading font-medium">{t("auth.registerTitle")}</h1>
        <p className="mt-2 text-base text-muted-foreground">{t("auth.registerIntro")}</p>

        <RegisterForm
          formik={formik}
          formError={formError}
          emailConflict={emailConflict}
          isPending={register.isPending}
          fullNameRef={fullNameRef}
          emailRef={emailRef}
          passwordRef={passwordRef}
        />

        <p className="mt-4 text-sm text-muted-foreground">
          {t("auth.haveAccount")} <AuthLink to="/login">{t("auth.loginLink")}</AuthLink>
        </p>
      </div>
    </section>
  );
}
