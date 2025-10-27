// src/lib/messages.ts
// Maps codes to friendly EN/AR messages.
// Pure presentation layer. No logic/security changes.

export type Locale = "en" | "ar";

type Messages = {
  generic: {
    unknown: string;
    offline: string;
    permission: string;
    notFound: string;
    badRequest: string;
    tryLater: string;
  };
  success: {
    saved: string;
    created: string;
    updated: string;
    deleted: string;
    submitted: string;
    sent: string;
  };
  codes: Record<string, string>;
};

const EN: Messages = {
  generic: {
    unknown: "Something went wrong. Please try again",
    offline: "You seem offline. Check your connection",
    permission: "You don't have permission to do that",
    notFound: "We couldn't find what you're looking for",
    badRequest: "Please check the form and try again",
    tryLater: "Please try again in a moment",
  },
  success: {
    saved: "Changes saved successfully",
    created: "Created successfully", 
    updated: "Updated successfully",
    deleted: "Deleted successfully",
    submitted: "Submitted for review",
    sent: "Message sent successfully",
  },
  codes: {
    not_signed_in: "Please sign in to continue",
    token_refresh_failed: "Session refresh failed. Please sign in again",
    auth_state_error: "Sign-in check failed. Please retry",
    missing_token: "Please sign in to continue",
    not_provider: "Provider account required",
    invalid_plan: "Selected plan is not valid",
    plan_not_found: "Selected plan not found",
    no_service: "Service not found",
    no_updates: "No changes to save",
    no_files: "Please attach at least one file",
    id_required: "ID is required",
    missing_id: "ID is required",
    invalid_serviceId: "Invalid service",
    invalid_conversationId: "Invalid conversation",
    conversation_not_found: "Conversation not found",
    bad_event: "Unsupported request",
    invalid: "Invalid request",
    metabase_env_missing: "Console settings missing",
    no_tokens: "Credentials not available. Try again later",
  }
};

const AR: Messages = {
  generic: {
    unknown: "حدث خطأ ما. يرجى المحاولة مرة أخرى",
    offline: "يبدو أنك غير متصل بالإنترنت. تحقق من اتصالك",
    permission: "ليس لديك صلاحية للقيام بذلك",
    notFound: "لم نتمكن من العثور على ما تبحث عنه",
    badRequest: "يرجى التحقق من النموذج والمحاولة مرة أخرى",
    tryLater: "يرجى المحاولة مرة أخرى بعد قليل",
  },
  success: {
    saved: "تم حفظ التغييرات بنجاح",
    created: "تم الإنشاء بنجاح",
    updated: "تم التحديث بنجاح", 
    deleted: "تم الحذف بنجاح",
    submitted: "تم الإرسال للمراجعة",
    sent: "تم إرسال الرسالة بنجاح",
  },
  codes: {
    not_signed_in: "يرجى تسجيل الدخول للمتابعة",
    token_refresh_failed: "فشل تحديث الجلسة. يرجى إعادة تسجيل الدخول",
    auth_state_error: "فشل التحقق من تسجيل الدخول. يرجى المحاولة مرة أخرى",
    missing_token: "يرجى تسجيل الدخول للمتابعة",
    not_provider: "مطلوب حساب مزود خدمة",
    invalid_plan: "الخطة المختارة غير صالحة",
    plan_not_found: "الخطة المختارة غير موجودة",
    no_service: "الخدمة غير موجودة",
    no_updates: "لا توجد تغييرات للحفظ",
    no_files: "يرجى إرفاق ملف واحد على الأقل",
    id_required: "المعرف مطلوب",
    missing_id: "المعرف مطلوب",
    invalid_serviceId: "خدمة غير صالحة",
    invalid_conversationId: "محادثة غير صالحة",
    conversation_not_found: "لم يتم العثور على المحادثة",
    bad_event: "طلب غير مدعوم",
    invalid: "طلب غير صالح",
    metabase_env_missing: "إعدادات لوحة التحكم مفقودة",
    no_tokens: "بيانات الاعتماد غير متوفرة. حاول لاحقًا",
  }
};

const L = (locale: Locale): Messages => (locale === "ar" ? AR : EN);

export function formatMessage(codeOrMsg: unknown, locale: Locale): string {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return L(locale).generic.offline;
  }
  
  const t = L(locale);
  
  if (typeof codeOrMsg !== "string") return t.generic.unknown;
  
  if (codeOrMsg in t.codes) {
    return t.codes[codeOrMsg];
  }
  
  if (codeOrMsg.includes("permission")) return t.generic.permission;
  if (codeOrMsg.includes("not found")) return t.generic.notFound;
  if (codeOrMsg.includes("bad request")) return t.generic.badRequest;
  
  return t.generic.unknown;
}

export function success(locale: Locale, key: keyof Messages["success"]) {
  return L(locale).success[key];
}