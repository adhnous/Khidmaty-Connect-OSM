// src/lib/i18n.ts
// Encoding: UTF-8 (no BOM)

export type Locale = 'en' | 'ar';

export const dict = {
  /* =========================
   * ENGLISH
   * ========================= */
  en: {
    header: {
      browse: 'Browse Services',
      providers: 'For Providers',
      providerDashboard: 'Provider Dashboard',
      myServices: 'My Services',
      addService: 'Add New Service',
      profile: 'Profile',
      signOut: 'Sign Out',
      login: 'Login / Sign Up',
      switch: 'Switch language',
    },

    login: {
      welcome: 'Welcome',
      subtitle: 'Sign in or create an account to continue',
      tabs: { signin: 'Sign In', signup: 'Sign Up' },
      fields: {
        email: 'Email',
        password: 'Password',
        roleLabel: 'I am a...',
        roleSeeker: 'Service Seeker (Looking for a professional)',
        roleProvider: 'Service Provider (Offering my services)',
      },
      priceModeOptions: {
        firm: 'Firm',
        negotiable: 'Negotiable',
        call: 'Call me',
      },
      actions: {
        signIn: 'Sign In',
        signUp: 'Create Account',
        forgot: 'Forgot password?',
      },
      toasts: {
        accountCreatedTitle: 'Account Created',
        accountCreatedDesc: 'You have been successfully signed up.',
        signedInTitle: 'Signed In',
        signedInDesc: 'You have been successfully signed in.',
        emailInUseTitle: 'Email already in use',
        emailInUseDesc:
          'We switched you to Sign In. If you forgot your password, click "Forgot password?"',
        signUpFailedTitle: 'Sign Up Failed',
        signUpFailedDesc: 'An unexpected error occurred.',
        signOutFailedTitle: 'Sign Out Failed',
        signOutFailedDesc: 'There was an error signing out.',
        emailRequiredTitle: 'Email required',
        emailRequiredDesc: 'Enter your email, then click Forgot password.',
        resetSentTitle: 'Password reset sent',
        resetSentDesc: 'Check your email for a reset link.',
        resetFailedTitle: 'Reset failed',
        resetFailedDesc: 'Could not send reset email.',
        redirectFailedTitle: 'Redirect failed',
        redirectFailedDesc: 'Could not retrieve user profile for redirection.',
        verifyEmailSentTitle: 'Verification email sent',
        verifyEmailSentDesc: 'Please check your inbox and click the link to verify.',
        pleaseVerifyTitle: 'Please verify your email',
        pleaseVerifyDesc: 'We sent you a verification email. Verify to continue.',
      },
    },

    verify: {
      title: 'Verify your email',
      description:
        'A verification link was sent to your email. Please click the link, then return here.',
      resend: 'Resend verification email',
      check: 'I verified — Refresh',
      verifiedTitle: 'Email verified',
      verifiedDesc: 'Redirecting…',
      notVerifiedTitle: 'Not verified yet',
      notVerifiedDesc: 'Please check your inbox (or spam) and click the link.',
      useDifferentEmail: 'Use a different email',
    },

    home: {
      heroTitle: 'Find Local Services You Can Trust',
      heroSubtitle: 'Your connection to skilled professionals in Libya.',
      providerCta: 'I am a Provider — List my service',
      seekerCta: 'I am a Seeker — Find services',
      searchPlaceholder: 'What service are you looking for?',
      cityPlaceholder: 'City',
      categoryPlaceholder: 'Category',
      allCities: 'All Cities',
      allCategories: 'All Categories',
      maxPricePlaceholder: 'Max price',
      search: 'Search',
      featuredCategories: 'Featured Categories',
      popularServices: 'Popular Services',
      loading: 'Loading services…',
      empty1: 'No services yet.',
      empty2: 'Go to Dashboard → My Services to create a new service.',
      sortBy: 'Sort by',
      sortNewest: 'Newest',
      sortPriceLow: 'Price: Low to High',
      sortPriceHigh: 'Price: High to Low',
    },

    categories: {
      sales: 'Sales & Trade',
      digitalMarketing: 'Digital Marketing',
      electrical: 'Electrical',
      automotive: 'Automotive',
      homeServices: 'Home Services',
      education: 'Education',
      plumbing: 'Plumbing',
      transport: 'Transport',
      carWash: 'Car Wash',
      childcare: 'Childcare',
      general: 'General',
    },

    cities: {
      tripoli: 'Tripoli',
      benghazi: 'Benghazi',
      misrata: 'Misrata',
    },

    common: {
      loading: 'Loading...',
      error: 'An error occurred',
      retry: 'Retry',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      confirm: 'Confirm',
      search: 'Search',
      noResults: 'No results found',
      success: 'Success',
      failed: 'Failed',
      required: 'Required',
      optional: 'Optional',
      yes: 'Yes',
      no: 'No',
      close: 'Close',
      next: 'Next',
      previous: 'Previous',
      submit: 'Submit',
      processing: 'Processing...',
      update: 'Update',
      create: 'Create',
      edit: 'Edit',
      view: 'View',
      back: 'Back',
      continue: 'Continue',
      done: 'Done',
      skip: 'Skip',
      more: 'More',
      less: 'Less',
      show: 'Show',
      hide: 'Hide',
      active: 'Active',
      inactive: 'Inactive',
      enabled: 'Enabled',
      disabled: 'Disabled',
      connected: 'Connected',
      disconnected: 'Disconnected',
      online: 'Online',
      offline: 'Offline',
      readMore: 'Read More',
      showLess: 'Show Less',
    },

    wizard: {
      title: 'Create Service',
      subtitle4: '4 steps: category, details, pricing, confirm',
      subtitle5: '5 steps: category, details, media, pricing, confirm',
      steps: {
        category: 'Category',
        details: 'Details',
        media: 'Media',
        pricing: 'Pricing',
        confirm: 'Confirm',
      },
      reviewHint: 'Review the information below before finishing.',
      finish: 'Finish',
      cancel: 'Cancel',
    },

    details: {
      loading: 'Loading service…',
      notFoundTitle: 'Service not found',
      notFoundBodyError: 'There was a problem loading this service.',
      notFoundBodyRemoved: 'This service may have been removed.',
      goHome: 'Go to homepage',
      backToMyServices: 'Back to My Services',
      description: 'Description',
      availability: 'Availability',
      location: 'Location',
      approxIn: 'Approximate location in',
      video: 'Video',
      servicePrice: 'Service Price',
      callForPrice: 'Call for price',
      negotiable: 'Negotiable',
      viewOnMap: 'View on map',
      contactWhatsApp: 'Contact via WhatsApp',
      callProvider: 'Call Provider',
      noContact: 'Contact details not provided.',
      chatInApp: 'Chat with Provider',
      requestService: 'Request Service',
      requestSent: 'Request sent',
      requestFailed: 'Could not send request',
      reviews: 'Reviews & Ratings',
    },

    chat: {
      title: 'Chat',
      typeMessage: 'Type a message…',
      send: 'Send',
      start: 'Start a conversation',
      notAllowed: 'You do not have access to this conversation.',
      signInPrompt: 'Please sign in to chat.',
      empty: 'No messages yet.',
    },

    reviews: {
      ratingLabel: 'Your rating',
      writeReview: 'Write a review',
      placeholder: 'Share your experience (optional, up to 1000 characters)…',
      submit: 'Submit review',
      update: 'Update review',
      delete: 'Delete review',
      signInPrompt: 'Sign in to leave a review.',
      ownerBlocked: 'You cannot review your own service.',
      empty: 'No reviews yet.',
      toasts: {
        saved: 'Review saved',
        deleted: 'Review deleted',
        saveFailed: 'Could not save review',
        deleteFailed: 'Could not delete review',
        requiredRating: 'Please select a star rating.',
      },
    },

    form: {
        
      labels: {
        title: 'Service Title',
        description: 'Description',
        category: 'Category',
        price: 'Price (in LYD)',
        priceMode: 'Price option',
        city: 'City',
        area: 'Area / Neighborhood',
        latitude: 'Latitude (optional)',
        longitude: 'Longitude (optional)',
        advancedLocation: 'Advanced location (optional)',
        pickLocation: 'Pick location on map (optional)',
        mapUrl: 'Map URL (optional)',
        availabilityNote: 'Availability Note (optional)',
        contactPhone: 'Contact Phone',
        contactWhatsapp: 'WhatsApp Number',
        videoUrl: 'YouTube Video URL (optional)',
        videoUrls: 'Additional YouTube Links',
        facebookUrl: 'Facebook URL (optional)',
        telegramUrl: 'Telegram URL (optional)',
        images: 'Service Images (1-8)',
        coverImage: 'Cover Image (optional)',
      },
      images: {
        label: 'Images',
        addFiles: 'Upload image',
        pasteUrlPlaceholder: 'Paste image URL',
        addUrl: 'Add image via URL',
        moveUp: 'Move up',
        moveDown: 'Move down',
        replace: 'Replace',
        replaceUrl: 'Replace URL',
        remove: 'Remove',
        none: 'No images',
        helper: 'PNG/JPG/WebP up to 5MB',
        urlInvalid: 'Invalid image URL',
        confirmDelete: 'Delete this image?',
      },
      priceModeOptions: {
        firm: 'Firm',
        negotiable: 'Negotiable',
        call: 'Call me',
      },
      toasts: {
        imagesAdded: 'Images added',
        addImagesFailed: 'Could not add images',
        imageReplaced: 'Image replaced',
        replaceFailed: 'Could not replace image',
        updateSuccess: 'Changes saved',
        updateFailedTitle: 'Update failed',
      },
    },
  },
  
  /* =========================
   * ARABIC
   * ========================= */
  ar: {
    header: {
      browse: 'تصفح الخدمات',
      providers: 'للمقدّمين',
      providerDashboard: 'لوحة المزود',
      myServices: 'خدماتي',
      addService: 'إضافة خدمة جديدة',
      profile: 'الملف الشخصي',
      signOut: 'تسجيل الخروج',
      login: 'تسجيل الدخول / إنشاء حساب',
      switch: 'تغيير اللغة',
    },
    footer:{
      aboutUs: 'عننا',
      contactUs: 'اتصل بنا',
      terms: 'الشروط والأحكام',
      privacy: 'سياسة الخصوصية',
      help: 'المساعدة',
    },
   dashboard: {
    serviceForm: {
      editSubtitle: 'إضافة خدمة',
      subtitle: 'أدخل معلومات الخدمة',
      fields: {
        title: 'العنوان',
        description: 'الوصف',
        price: 'السعر',
        priceMode: 'طريقة تحديد السعر',
        category: 'الفئة',
        city: 'المدينة',
        area: 'المنطقة',
        availabilityNote: 'ملاحظة عن المتاحة',
        images: 'الصور',
        contactPhone: 'رقم الهاتف',
        contactWhatsapp: 'واتساب',
        videoUrl: 'رابط الفيديو',
        facebookUrl: 'رابط الفيسبوك',
        telegramUrl: 'رابط التيليجرام',
        mapUrl: 'رابط الخريطة',
        providerId: 'معرف المزود',
        providerName: 'اسم المزود',
        providerEmail: 'بريد المزود',
        subservices: 'الخدمات الفرعية',
        status: 'الحالة',
        lat: 'الatitude',
        editSubtitle: 'تعديل الخدمة',
        lng: 'الطول',
        featured: 'مميز',
        priority: 'الأولوية',
        shareCount: 'عدد المشares',
      },
      createSubtitle: 'إضافة خدمة',
      createTitle: 'إضافة خدمة',
      editTitle: 'تعديل الخدمة',
      saving: 'جارٍ الحفظ…',
      finish: 'إتمام',
      cancel: 'إلغاء',
      reviewHint: 'مراجعة المعلومات قبل الانتهاء.',
      saveChanges: 'حفظ التغييرات',
      
      

    },
      sidebar: {
        services: 'خدماتي',
        analytics: 'تحليلاتي',
        profile: 'الملف الشخصي',
        settings: 'الإعدادات',
        logout: 'تسجيل الخروج',
        addService: 'إضافة خدمة جديدة',
      },
      
      welcome: {
        title: 'مرحبًا في لوحة التحكم',
        subtitle: 'أنت الآن في لوحة التحكم الخاصة بك.',
        prompt: 'اختر عنصرًا من الشريط الجانبي للبدء.',
        goServices: 'اذهب إلى خدماتي',
        addService: 'إضافة خدمة جديدة',
      },
      services: {
        title: 'خدماتي',
        subtitle: 'اعرض وأدر جميع قوائم خدماتك.',
        newService: 'خدمة جديدة',
        seedSamples: 'إضافة عينات',
        loading: 'جارٍ التحميل…',
        emptyTitle: 'لا توجد خدمات بعد.',
        createFirst: 'أنشئ أول خدمة لك',
        seedSampleServices: 'إضافة خدمات تجريبية',
         table: {
          headers: {
            title: 'العنوان',
            category: 'الفئة',
            city: 'المدينة',
            price: 'السعر (د.ل)',
            actions: 'الإجراءات',
            status: 'الحالة',
            createdAt: 'تاريخ الإنشاء',
            providerName: 'اسم المزود',
            providerEmail: 'بريد المزود',
            providerPhone: 'رقم المزود',
            providerWhatsapp: 'واتساب المزود',
            providerAddress: 'عنوان المزود',
            providerCity: 'المدينة',
            providerArea: 'المنطقة',
            providerLat: 'الatitude',
            providerLng: 'الطول',
            providerFeatured: 'مميز',
            providerPriority: 'الأولوية',
            providerShareCount: 'عدد المشares',
          },
          
        },
        actions: {
          view: 'عرض',
          edit: 'تعديل',
          delete: 'حذف',
          deleteConfirm: 'هل أنت متأكد من حذف هذه الخدمة؟',
          deleteConfirmDesc: 'هذه الخطوة لا يمكن التراجع عنها.',
          deleteConfirmCancel: 'إلغاء',
          deleteConfirmConfirm: 'حذف',
          deleteFailed: 'فشل في حذف الخدمة',
          deleteSuccess: 'تم حذف الخدمة بنجاح',
        },
      },
       
      
    },
  
    login: {
      welcome: 'أهلًا وسهلًا',
      subtitle: 'سجل دخولك أو أنشئ حسابًا جديدًا للمتابعة',
      tabs: { signin: 'دخول', signup: 'حساب جديد' },
      fields: {
        email: 'البريد الإلكتروني',
        password: 'كلمة المرور',
        roleLabel: 'أنا...',
        roleSeeker: 'باحث عن خدمة (أبحث عن متخصص)',
        roleProvider: 'مقدم خدمة (أقدم خدماتي)',
      },
      priceModeOptions: {
        firm: 'ثابت',
        negotiable: 'قابل للتفاوض',
        call: 'اتصل بي',
      },
      actions: {
        signIn: 'تسجيل دخول',
        signUp: 'إنشاء حساب',
        forgot: 'نسيت كلمة المرور؟',
      },
      toasts: {
        accountCreatedTitle: 'تم إنشاء الحساب',
        accountCreatedDesc: 'تم التسجيل بنجاح.',
        signedInTitle: 'تم تسجيل الدخول',
        signedInDesc: 'تم تسجيل الدخول بنجاح.',
        emailInUseTitle: 'البريد الإلكتروني مستخدم',
        emailInUseDesc:
          'تم التحويل لصفحة تسجيل الدخول. إذا نسيت كلمة المرور، اضغط على "نسيت كلمة المرور؟"',
        signUpFailedTitle: 'فشل إنشاء الحساب',
        signUpFailedDesc: 'حدث خطأ غير متوقع.',
        signOutFailedTitle: 'فشل تسجيل الخروج',
        signOutFailedDesc: 'حدث خطأ أثناء تسجيل الخروج.',
        emailRequiredTitle: 'البريد الإلكتروني مطلوب',
        emailRequiredDesc: 'أدخل بريدك الإلكتروني ثم اضغط على نسيت كلمة المرور.',
        resetSentTitle: 'تم إرسال رابط الاستعادة',
        resetSentDesc: 'تفقد بريدك الإلكتروني للحصول على رابط الاستعادة.',
        resetFailedTitle: 'فشلت عملية الاستعادة',
        resetFailedDesc: 'تعذر إرسال بريد استعادة كلمة المرور.',
        redirectFailedTitle: 'فشل التوجيه',
        redirectFailedDesc: 'تعذر استرداد بيانات المستخدم للتوجيه.',
        verifyEmailSentTitle: 'تم إرسال رابط التحقق',
        verifyEmailSentDesc: 'يرجى تفقد بريدك الوارد والضغط على الرابط للتحقق.',
        pleaseVerifyTitle: 'يرجى تأكيد بريدك الإلكتروني',
        pleaseVerifyDesc: 'تم إرسال بريد التحقق. قم بتأكيد بريدك للمتابعة.',
      },
    },

    verify: {
      title: 'تحقق من بريدك الإلكتروني',
      description:
        'تم إرسال رابط التحقق إلى بريدك الإلكتروني. يرجى النقر على الرابط ثم العودة هنا.',
      resend: 'إعادة إرسال رابط التحقق',
      check: 'لقد تحققت — تحديث',
      verifiedTitle: 'تم التحقق من البريد',
      verifiedDesc: 'جاري إعادة التوجيه…',
      notVerifiedTitle: 'لم يتم التحقق بعد',
      notVerifiedDesc: 'يرجى التحقق من صندوق الوارد (أو البريد غير المرغوب فيه) والنقر على الرابط.',
      useDifferentEmail: 'استخدم بريدًا مختلفًا',
    },

    home: {
      heroTitle: 'اعثر على خدمات محلية موثوقة',
      heroSubtitle: 'صلتك بالمحترفين المهرة في ليبيا.',
      providerCta: 'أنا مقدم خدمة — أدرج خدمتي',
      seekerCta: 'أنا باحث عن خدمة — اعثر على الخدمات',
      searchPlaceholder: 'ما الخدمة التي تبحث عنها؟',
      cityPlaceholder: 'المدينة',
      categoryPlaceholder: 'الفئة',
      allCities: 'كل المدن',
      allCategories: 'كل الفئات',
      maxPricePlaceholder: 'أقصى سعر',
      search: 'بحث',
      featuredCategories: 'فئات مميزة',
      popularServices: 'خدمات شائعة',
      loading: 'جارٍ تحميل الخدمات…',
      empty1: 'لا توجد خدمات بعد.',
      empty2: 'اذهب إلى لوحة التحكم → خدماتي لإنشاء خدمة جديدة.',
      sortBy: 'ترتيب حسب',
      sortNewest: 'الأحدث',
      sortPriceLow: 'السعر: من الأقل إلى الأعلى',
      sortPriceHigh: 'السعر: من الأعلى إلى الأقل',
    },
   
    categories: {
      sales: 'المبيعات والتجارة',
      digitalMarketing: 'التسويق الرقمي',
      electrical: 'كهرباء',
      automotive: 'سيارات',
      homeServices: 'خدمات منزلية',
      education: 'تعليم',
      plumbing: 'سباكة',
      transport: 'نقل',
      carWash: 'غسيل سيارات',
      childcare: 'رعاية أطفال',
      general: 'عام',
      health: 'صحة',
      beauty: 'جمال',
      fitness: 'لياقة جسدية',
      consulting: 'استشارات',   
    },

    cities: {
      tripoli: 'طرابلس',
      benghazi: 'بنغازي',
      misrata: 'مصراتة',
    },

    common: {
      loading: 'جار التحميل...',
      error: 'حدث خطأ',
      retry: 'إعادة المحاولة',
      save: 'حفظ',
      cancel: 'إلغاء',
      delete: 'حذف',
      confirm: 'تأكيد',
      search: 'بحث',
      noResults: 'لا توجد نتائج',
      success: 'نجاح',
      failed: 'فشل',
      required: 'مطلوب',
      optional: 'اختياري',
      yes: 'نعم',
      no: 'لا',
      close: 'إغلاق',
      next: 'التالي',
      previous: 'السابق',
      submit: 'إرسال',
      processing: 'جاري المعالجة...',
      update: 'تحديث',
      create: 'إنشاء',
      edit: 'تعديل',
      view: 'عرض',
      back: 'رجوع',
      continue: 'متابعة',
      done: 'تم',
      skip: 'تخطي',
      more: 'المزيد',
      less: 'أقل',
      show: 'إظهار',
      hide: 'إخفاء',
      active: 'نشط',
      inactive: 'غير نشط',
      enabled: 'مفعل',
      disabled: 'معطل',
      connected: 'متصل',
      disconnected: 'غير متصل',
      online: 'متصل',
      offline: 'غير متصل',
      readMore: 'اقرأ المزيد',
      showLess: 'عرض أقل',
    },

    wizard: {
      title: 'إنشاء خدمة',
      subtitle4: '٤ خطوات: الفئة، التفاصيل، التسعير، التأكيد',
      subtitle5: '٥ خطوات: الفئة، التفاصيل، الوسائط، التسعير، التأكيد',
      steps: {
        category: 'الفئة',
        details: 'التفاصيل',
        media: 'وسائط',
        pricing: 'التسعير',
        confirm: 'تأكيد',
      },
      reviewHint: 'راجِع المعلومات أدناه قبل الإنهاء.',
      finish: 'إنهاء',
      cancel: 'إلغاء',
    },

    details: {
      loading: 'جارٍ تحميل الخدمة…',
      notFoundTitle: 'الخدمة غير موجودة',
      notFoundBodyError: 'حدثت مشكلة أثناء تحميل هذه الخدمة.',
      notFoundBodyRemoved: 'قد تكون هذه الخدمة قد أزيلت.',
      goHome: 'اذهب للصفحة الرئيسية',
      backToMyServices: 'العودة إلى خدماتي',
      description: 'الوصف',
      availability: 'التوفر',
      location: 'الموقع',
      approxIn: 'الموقع التقريبي في',
      video: 'فيديو',
      servicePrice: 'سعر الخدمة',
      callForPrice: 'اتصل لمعرفة السعر',
      negotiable: 'قابل للتفاوض',
      viewOnMap: 'عرض على الخريطة',
      contactWhatsApp: 'تواصل عبر واتساب',
      callProvider: 'اتصل بالمقدم',
      noContact: 'لم يتم توفير بيانات التواصل.',
      chatInApp: 'دردشة داخل التطبيق',
      requestService: 'طلب الخدمة',
      requestSent: 'تم إرسال الطلب',
      requestFailed: 'تعذر إرسال الطلب',
      reviews: 'المراجعات والتقييمات',
    },

    chat: {
      title: 'الدردشة',
      typeMessage: 'اكتب رسالة…',
      send: 'إرسال',
      start: 'ابدأ محادثة',
      notAllowed: 'لا تملك صلاحية الوصول إلى هذه المحادثة.',
      signInPrompt: 'يرجى تسجيل الدخول للدردشة.',
      empty: 'لا توجد رسائل بعد.',
    },

    reviews: {
      ratingLabel: 'تقييمك',
      writeReview: 'اكتب مراجعة',
      placeholder: 'شارك تجربتك (اختياري، حتى 1000 حرف)…',
      submit: 'إرسال المراجعة',
      update: 'تحديث المراجعة',
      delete: 'حذف المراجعة',
      signInPrompt: 'سجّل الدخول لتترك مراجعة.',
      ownerBlocked: 'لا يمكنك مراجعة خدمتك الخاصة.',
      empty: 'لا توجد مراجعات بعد.',
      toasts: {
        saved: 'تم حفظ المراجعة',
        deleted: 'تم حذف المراجعة',
        saveFailed: 'تعذر حفظ المراجعة',
        deleteFailed: 'تعذر حذف المراجعة',
        requiredRating: 'يرجى اختيار عدد النجوم.',
      },
    },

    form: {
     placeholders:{
      searchAddress: 'بحث عن العنوان',
     contactPhone: 'رقم الهاتف',
     contactWhatsapp: 'رقم واتساب',
     videoUrl: 'رابط فيديو يوتيوب',
     videoUrls: 'روابط يوتيوب إضافية',
     facebookUrl: 'رابط فيسبوك',
     telegramUrl: 'رابط تيليغرام',
     mapUrl: 'رابط الخريطة',
     availabilityNote: 'ملاحظة التوفر',
     availability: 'ملاحظة التوفر',
     },
      labels: {
        title: 'عنوان الخدمة',
        description: 'الوصف',
        category: 'الفئة',
        price: 'السعر (بالدينار الليبي)',
        priceMode: 'خيار السعر',
        city: 'المدينة',
        area: 'المنطقة / الحي',
        latitude: 'خط العرض (اختياري)',
        longitude: 'خط الطول (اختياري)',
        advancedLocation: 'موقع متقدم (اختياري)',
        pickLocation: 'اختر الموقع على الخريطة (اختياري)',
        mapUrl: 'رابط الخريطة (اختياري)',
        availabilityNote: 'ملاحظة التوفر (اختياري)',
        contactPhone: 'رقم الهاتف',
        contactWhatsapp: 'رقم واتساب',
        videoUrl: 'رابط فيديو يوتيوب (اختياري)',
        videoUrls: 'روابط يوتيوب إضافية',
        facebookUrl: 'رابط فيسبوك (اختياري)',
        telegramUrl: 'رابط تيليغرام (اختياري)',
        images: 'صور الخدمة (1-8)',
        coverImage: 'صورة الغلاف (اختياري)',
      },
      actions:{ clearLocation: 'مسح الموقع',  useMyLocation: 'استخدام موقعي الحالي',},
      images:{
        placeholder: 'أدخل الصورة',
        addFiles: 'إضافة صورة',
        pasteUrlPlaceholder: 'لصق رابط الصورة',
        addUrl: 'إضافة صورة عبر رابط',
        moveUp: 'تحريك الصورة للأعلى',
        moveDown: 'تحريك الصورة للأسفل',
        label: 'الصور',
        replace: 'استبدال',
        replaceUrl: 'استبدال الرابط',
        remove: 'حذف',
        none: 'لا توجد صور',
        helper: 'PNG/JPG/WebP حتى 5MB',
        urlInvalid: 'رابط الصورة غير صالح',
        confirmDelete: 'هل تريد حذف هذه الصورة؟',
      },
      priceModeOptions: {
        firm: 'ثابت',
        negotiable: 'قابل للتفاوض',
        call: 'اتصل بي',
      },
      subservices: {
        titlePlural: 'الخدمات',
        titleSingular: 'الخدمة',
        subtitlePlural: 'الخدمات',
        subtitleSingular: 'الخدمة',
        placeholder: 'أدخل الخدمة',
        empty: 'لا توجد خدمات',
        add: 'إضافة خدمة',
        remove: 'إزالة خدمة',
        save: 'حفظ الخدمة',
        cancel: 'إلغاء',
        

      },
      toasts: {
        imagesAdded: 'تمت إضافة الصور',
        addImagesFailed: 'تعذر إضافة الصور',
        imageReplaced: 'تم استبدال الصورة',
        replaceFailed: 'تعذر استبدال الصورة',
        updateSuccess: 'تم حفظ التغييرات',
        updateFailedTitle: 'فشل التحديث',
      }
    },
  },
} as const;

/* -----------------------------
 * Helpers
 * ----------------------------- */
function get(obj: any, path: string): any {
  try {
    return path
      .split('.')
      .reduce(
        (acc: any, key: string) => (acc && typeof acc === 'object' ? acc[key] : undefined),
        obj
      );
  } catch {
    return undefined;
  }
}

export function tr(locale: Locale, key: string): string {
  try {
    // 1) Try requested locale
    const primary = get((dict as any)[locale], key);
    if (typeof primary === 'string') return primary;

    // 2) Fallback to the other locale
    const fallbackLocale: Locale = locale === 'ar' ? 'en' : 'ar';
    const fallback = get((dict as any)[fallbackLocale], key);
    if (typeof fallback === 'string') return fallback;

    // 3) Dev log
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(`[i18n] Missing translation for key: "${key}" in locale: "${locale}"`);
    }
    return key;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`[i18n] Error getting translation for key: "${key}"`, error);
    return key;
  }
}

export function getClientLocale(): Locale {
  try {
    if (typeof document === 'undefined') return 'ar'; // server default
    const m = document.cookie.match(/(?:^|; )locale=([^;]+)/);
    if (m && m[1]) return m[1].toLowerCase().startsWith('ar') ? 'ar' : 'en';
    const htmlLang = document.documentElement.getAttribute('lang');
    if (htmlLang) return htmlLang.toLowerCase().startsWith('ar') ? 'ar' : 'en';
    return 'ar';
  } catch {
    return 'ar';
  }
}

export const dictionaries = dict;
