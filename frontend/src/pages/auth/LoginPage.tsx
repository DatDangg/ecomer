import { useEffect, useRef, useState, type RefObject } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useFormik, type FormikProps } from "formik";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { AuthLink } from "@/features/auth/AuthLink";
import { PasswordInput } from "@/features/auth/PasswordInput";
import { resolveSafeRedirect } from "@/features/auth/form-utils";
import { loginSchema, type LoginFormValues } from "@/features/auth/schemas";
import { useLogin } from "@/features/auth/useAuthMutations";
import { ApiRequestError } from "@/lib/api-client";
import { notifySuccess } from "@/lib/toast";
import { firstInvalidField, toFieldErrorsFromApi, type FieldErrors } from "@/lib/validation";

export const LOCKED_ACCOUNT_MESSAGE = "Tài khoản đã bị khóa";
const FIELD_ORDER = ["email", "password"] as const;

interface LoginLocationState {
  from?: unknown;
  registered?: boolean;
  email?: string;
}

interface LoginApiErrorResult {
  field?: "password";
  fieldMessage?: string;
  fieldErrors?: FieldErrors;
  formError?: string;
}

/** Maps a login failure to inline field error(s) or a form-level message. */
function mapLoginApiError(error: unknown, t: TFunction): LoginApiErrorResult {
  const apiError = error instanceof ApiRequestError ? error : null;

  if (apiError?.status === 401) {
    return {
      field: "password",
      fieldMessage: apiError.message || t("auth.invalidCredentials"),
    };
  }

  if (apiError?.status === 403 && apiError.message === LOCKED_ACCOUNT_MESSAGE) {
    return { formError: LOCKED_ACCOUNT_MESSAGE };
  }

  if (apiError?.errors?.length) {
    return { fieldErrors: toFieldErrorsFromApi(apiError.errors) };
  }

  if (apiError?.status === 429) {
    return { formError: t("auth.tooManyAttempts") };
  }

  return { formError: apiError?.message ?? t("auth.networkError") };
}

/** Owns login form state, API call, inline error mapping and first-error focus. */
function useLoginForm(initialEmail: string, from: unknown) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useLogin();
  const [formError, setFormError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const formik = useFormik<LoginFormValues>({
    initialValues: { email: initialEmail, password: "" },
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      setFormError(null);
      try {
        await login.mutateAsync({ email: values.email.trim(), password: values.password });
        notifySuccess(t("auth.loginSuccess"));
        navigate(resolveSafeRedirect(from), { replace: true });
      } catch (error) {
        const result = mapLoginApiError(error, t);
        if (result.fieldErrors) {
          formik.setErrors(result.fieldErrors);
        }
        if (result.field && result.fieldMessage) {
          formik.setFieldTouched(result.field, true, false);
          formik.setFieldError(result.field, result.fieldMessage);
        }
        setFormError(result.formError ?? null);
      }
    },
  });

  useEffect(() => {
    if (formik.submitCount === 0) return;
    const field = firstInvalidField(formik.errors, FIELD_ORDER);
    if (field === "email") emailRef.current?.focus();
    if (field === "password") passwordRef.current?.focus();
  }, [formik.submitCount, formik.errors]);

  return { formik, formError, login, emailRef, passwordRef };
}

interface LoginFormProps {
  formik: FormikProps<LoginFormValues>;
  formError: string | null;
  isPending: boolean;
  emailRef: RefObject<HTMLInputElement>;
  passwordRef: RefObject<HTMLInputElement>;
}

function LoginForm({ formik, formError, isPending, emailRef, passwordRef }: LoginFormProps) {
  const { t } = useTranslation();
  const emailError = formik.touched.email ? formik.errors.email : undefined;
  const passwordError = formik.touched.password ? formik.errors.password : undefined;

  return (
    <form noValidate onSubmit={formik.handleSubmit} className="mt-6 flex flex-col gap-4">
      {formError ? <FormAlert tone="error">{formError}</FormAlert> : null}

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

      <FormField id="password" label={t("auth.passwordLabel")} error={passwordError}>
        <PasswordInput
          ref={passwordRef}
          id="password"
          name="password"
          value={formik.values.password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          autoComplete="current-password"
          invalid={Boolean(passwordError)}
          describedBy={passwordError ? "password-error" : undefined}
        />
      </FormField>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? t("auth.loggingIn") : t("auth.loginSubmit")}
      </Button>
    </form>
  );
}

export function LoginPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const locationState = (location.state as LoginLocationState | null) ?? null;
  const { formik, formError, login, emailRef, passwordRef } = useLoginForm(
    locationState?.email ?? "",
    locationState?.from,
  );

  return (
    <section className="container-page py-10 md:py-16">
      <div className="mx-auto w-full max-w-md">
        <h1 className="font-heading font-medium">{t("auth.loginTitle")}</h1>
        <p className="mt-2 text-base text-muted-foreground">{t("auth.loginIntro")}</p>

        {locationState?.registered ? (
          <FormAlert tone="success" className="mt-6">
            {t("auth.registerSuccess")}
          </FormAlert>
        ) : null}

        <LoginForm
          formik={formik}
          formError={formError}
          isPending={login.isPending}
          emailRef={emailRef}
          passwordRef={passwordRef}
        />

        <p className="mt-4 text-sm text-muted-foreground">
          {t("auth.noAccount")} <AuthLink to="/register">{t("auth.registerLink")}</AuthLink>
        </p>
      </div>
    </section>
  );
}
