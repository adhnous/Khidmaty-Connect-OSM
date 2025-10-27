// src/lib/messages.ts
// تعيين الرسائل باللغة العربية
// طبقة العرض فقط. لا تغييرات في المنطق/الأمان

export type Locale = "en" | "ar";

type MessageStructure = {
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
  codes: {
    [key: string]: string;
  };
};

const messages: MessageStructure = {
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
    invalid_token: "جلستك غير صالحة. يرجى إعادة تسجيل الدخول",
    forbidden: "ليس لديك صلاحية لتنفيذ هذا الإجراء",
    title_required: "يرجى إضافة عنوان",
    bad_request: "يرجى التحقق من النموذج والمحاولة مرة أخرى",
    not_found: "لم يتم العثور على العنصر المطلوب",
    internal_error: "خطأ في الخادم. يرجى المحاولة لاحقًا",
    invalid_status: "قيمة الحالة غير صالحة",
    already_requested: "لقد قمت بالطلب مسبقًا",
    invalid_provider: "حساب مزود الخدمة غير صالح",
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
    "lat and lng required": "يرجى تحديد الموقع على الخريطة",
    metabase_env_missing: "إعدادات لوحة التحكم مفقودة",
    no_tokens: "بيانات الاعتماد غير متوفرة. حاول لاحقًا",
  }
};

function getMessages(_locale: Locale = "ar"): MessageStructure {
  // Arabic is now the only language, so we always return the Arabic messages
  return messages;
}

export function formatMessage(codeOrMsg: unknown, _locale: Locale = "ar"): string {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return messages.generic.offline;
  }
  
  if (typeof codeOrMsg !== "string") return messages.generic.unknown;
  
  if (codeOrMsg in messages.codes) {
    return messages.codes[codeOrMsg];
  }
  
  if (codeOrMsg.includes("permission")) return messages.generic.permission;
  if (codeOrMsg.includes("not found")) return messages.generic.notFound;
  if (codeOrMsg.includes("bad request")) return messages.generic.badRequest;
  
  return messages.generic.unknown;
}

export function success(_locale: Locale = "ar", key: keyof MessageStructure["success"]) {
  return messages.success[key];
}