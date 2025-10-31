import { categories } from "./categories";

export type Locale = 'en' | 'ar';

const dict = {
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
        verifyEmailSentDesc: 
          'Please check your inbox and click the link to verify.',
        pleaseVerifyTitle: 'Please verify your email',
        pleaseVerifyDesc: 'We sent you a verification email. Verify to continue.',
      },
    },
    verify: {
      title: 'Verify your email',
      description:
        'A verification link was sent to your email. Please click the link, then return here.',
      resend: 'Resend verification email',
      check: 'I verified â€” Refresh',
      verifiedTitle: 'Email verified',
      verifiedDesc: 'Redirectingâ€¦',
      notVerifiedTitle: 'Not verified yet',
      notVerifiedDesc: 'Please check your inbox (or spam) and click the link.',
      useDifferentEmail: 'Use a different email',
    },
    home: {
      heroTitle: 'Find Local Services You Can Trust',
      heroSubtitle: 'Your connection to skilled professionals in Libya.',
      providerCta: 'I am a Provider â€“ List my service',
      seekerCta: 'I am a Seeker â€“ Find services',
      searchPlaceholder: 'What service are you looking for?',
      cityPlaceholder: 'City',
      categoryPlaceholder: 'Category',
      allCities: 'All Cities',
      allCategories: 'All Categories',
      maxPricePlaceholder: 'Max price',
      search: 'Search',
      featuredCategories: 'Featured Categories',
      popularServices: 'Popular Services',
      loading: 'Loading servicesâ€¦',
      empty1: 'No services yet.',
      empty2: 'Go to Dashboard â†’ My Services to create a new service.',
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
    // NEW COMMON SECTION
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
      steps: { category: 'Category', details: 'Details', media: 'Media', pricing: 'Pricing', confirm: 'Confirm' },
      reviewHint: 'Review the information below before finishing.',
      finish: 'Finish',
      cancel: 'Cancel',
    },
    details: {
      loading: 'Loading serviceâ€¦',
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
      typeMessage: 'Type a messageâ€¦',
      send: 'Send',
      start: 'Start a conversation',
      notAllowed: 'You do not have access to this conversation.',
      signInPrompt: 'Please sign in to chat.',
      empty: 'No messages yet.',
    },
    reviews: {
      ratingLabel: 'Your rating',
      writeReview: 'Write a review',
      placeholder:
        'Share your experience (optional, up to 1000 characters)â€¦',
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
      },
    },
    // âœ… FIXED: English dashboard in English
    dashboard: {
      services: {
        title: 'My Services',
        subtitle: 'View and manage all your service listings.',
        newService: 'New Service',
        seedSamples: 'Add Samples',
        loading: 'Loadingâ€¦',
        emptyTitle: 'No services yet.',
        createFirst: 'Create your first service',
        seedSampleServices: 'Add Sample Services',
        table: {
          headers: {
            title: 'Title',
            category: 'Category',
            city: 'City',
            price: 'Price (LYD)',
            actions: 'Actions',
          },
        },
        actions: { view: 'View', edit: 'Edit', delete: 'Delete' },
        toast: {
          deleted: 'Service deleted',
          deleteFailed: 'Delete failed',
          seeded: 'Sample services created',
          seedFailed: 'Failed to add samples',
        },
        confirmDelete:
          'Delete this service? This action cannot be undone.',
      },
      serviceForm: {
        newTitle: 'Create a New Service',
        newSubtitle:
          'Fill the details below to add your service to Khidmaty Connect.',
        editTitle: 'Edit Service',
        editSubtitle: 'Update your listing information.',
        saveChanges: 'Save changes',
        saving: 'Savingâ€¦',
        notAllowedTitle: 'Not allowed',
        notAllowedDesc: 'You can only edit your own services.',
      },
      sidebar: {
        myServices: 'My Services',
        addService: 'Add New Service',
        analytics: 'Analytics',
        profile: 'Profile',
        settings: 'Settings',
      },
      welcome: {
        title: 'Welcome to your Dashboard',
        subtitle:
          'Manage your services, profile, and analytics.',
        prompt:
          'Pick an item from the sidebar to get started.',
        goServices: 'Go to My Services',
        addService: 'Add New Service',
      },
      profile: {
        title: 'Your Profile',
        subtitle:
          'Update your personal information and contact details.',
        labels: {
          name: 'Full Name',
          phone: 'Phone Number',
          whatsapp: 'WhatsApp Number',
          city: 'City',
        },
        actions: {
          save: 'Save changes',
          saving: 'Savingâ€¦',
        },
      },
    },
    // âœ… FIXED: English map/footer/pages in English
    map: { usingOSMBadge: 'Powered by OpenStreetMap (Free)' },
    footer: {
      about: 'About',
      terms: 'Terms of Service',
      privacy: 'Privacy Policy',
      contact: 'Contact',
      rights: 'All rights reserved.',
    },
    pages: {
      about: { title: 'About Khidmaty Connect' },
      terms: { title: 'Terms of Service' },
      privacy: { title: 'Privacy Policy' },
      contact: { title: 'Contact' },
      pricing: {
        nav: 'Pricing',
        title: 'Simple prices that grow with you',
        subtitle:
          'Choose the plan that fits your needs. Upgrade any time.',
        perMonth: 'per month',
        choosePlan: 'Choose plan',
        plans: {
          basic: { name: 'Basic' },
          pro: { name: 'Pro' },
          enterprise: { name: 'Enterprise' },
        },
        features: {
          basic: {
            l1: 'List your services and receive leads',
            l2: 'Basic analytics',
          },
          pro: {
            l1: 'Boosted visibility',
            l2: 'Advanced analytics & insights',
            l3: 'Multiple contact methods',
            l4: 'Email/WhatsApp support',
          },
          enterprise: {
            l1: 'Prominent highlighting across categories',
            l2: 'Team accounts & roles',
            l3: 'Custom setup & training',
            l4: 'Dedicated success manager',
          },
        },
      },
      checkout: {
        title: 'Checkout',
        subtitle: 'Complete payment to activate your subscription.',
        txId: 'Transaction ID',
        plan: 'Plan',
        amount: 'Amount',
        status: 'Status',
        statusLabels: {
          pending: 'Pending',
          success: 'Paid',
          failed: 'Failed',
          cancelled: 'Cancelled',
        },
        scanHelp: 'Scan with your wallet app',
        openWallet: 'Open in Wallet App',
        copyCode: 'Copy payment code',
        refresh: 'I paid â€” Refresh',
        openWeb: 'Open Wallet (Web)',
        openFail:
          'Could not open the wallet app. If not installed, scan the QR or copy the payment code.',
        desktopHint:
          'On mobile, tap "Open in Wallet App". On desktop, scan the QR. This page updates after payment is confirmed.',
        failedNotice:
          'Payment failed. Go back to Pricing and try again.',
        cancelledNotice:
          'Payment was cancelled. You can try again from the Pricing page.',
      },
    },
  },

 // Replace ONLY the `ar: { ... }` branch with this UTF-8 clean version

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

    login: {
      welcome: 'أهلًا وسهلًا',
      subtitle: 'سجّل دخولك أو أنشئ حسابًا جديدًا للمتابعة',
      tabs: { signin: 'دخول', signup: 'حساب جديد' },
      fields: {
        email: 'البريد الإلكتروني',
        password: 'كلمة المرور',
        roleLabel: 'أنا...',
        roleSeeker: 'باحث عن خدمة (أبحث عن متخصص)',
        roleProvider: 'مقدّم خدمة (أقدّم خدماتي)',
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
          'تم تحويلك لصفحة تسجيل الدخول. إذا نسيت كلمة المرور، اضغط على "نسيت كلمة المرور؟"',
        signUpFailedTitle: 'فشل إنشاء الحساب',
        signUpFailedDesc: 'حدث خطأ غير متوقع.',
        signOutFailedTitle: 'فشل تسجيل الخروج',
        signOutFailedDesc: 'حدث خطأ أثناء تسجيل الخروج.',
        emailRequiredTitle: 'البريد الإلكتروني مطلوب',
        emailRequiredDesc: 'أدخل بريدك الإلكتروني ثم اضغط على "نسيت كلمة المرور".',
        resetSentTitle: 'تم إرسال رابط الاستعادة',
        resetSentDesc: 'تفقد بريدك الإلكتروني للحصول على رابط الاستعادة.',
        resetFailedTitle: 'فشلت عملية الاستعادة',
        resetFailedDesc: 'تعذّر إرسال بريد استعادة كلمة المرور.',
        redirectFailedTitle: 'فشل التوجيه',
        redirectFailedDesc: 'تعذّر استرداد بيانات المستخدم للتوجيه.',
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
      notVerifiedDesc:
        'يرجى التحقق من صندوق الوارد (أو البريد غير المرغوب فيه) والنقر على الرابط.',
      useDifferentEmail: 'استخدم بريدًا مختلفًا',
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
      processing: 'جارٍ المعالجة...',
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
      enabled: 'مفعّل',
      disabled: 'معطّل',
      connected: 'متصل',
      disconnected: 'غير متصل',
      online: 'متصل',
      offline: 'غير متصل',
      readMore: 'اقرأ المزيد',
      showLess: 'عرض أقل',
    },

    home: {
      heroTitle: 'اعثر على خدمات محلية موثوقة',
      heroSubtitle: 'صلتك بالمحترفين المهرة في ليبيا.',
      providerCta: 'أنا مقدّم خدمة – أدرج خدمتي',
      seekerCta: 'أنا باحث عن خدمة – اعثر على الخدمات',
      searchPlaceholder: 'ما الخدمة التي تبحث عنها؟',
      cityPlaceholder: 'المدينة',
      categoryPlaceholder: 'الفئة',
      allCities: 'كل المدن',
      allCategories: 'كل الفئات',
      maxPricePlaceholder: 'أقصى سعر',
      search: 'بحث',
      featuredCategories: 'فئات مميّزة',
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
      sales: 'البيع والتجارة',
      digitalMarketing: 'التسويق الرقمي',
      electrical: 'الكهرباء',
      automotive: 'خدمات السيارات',
      homeServices: 'الخدمات المنزلية',
      education: 'التعليم والتدريب',
      plumbing: 'السباكة',
      transport: 'النقل والتوصيل',
      carWash: 'غسيل السيارات',
      childcare: 'رعاية الأطفال',
      general: 'عام',
    },
    cities: {
      tripoli: 'طرابلس',
      benghazi: 'بنغازي',
      misrata: 'مصراتة',
    },

    wizard: {
      title: 'إنشاء خدمة',
      subtitle4: '٤ خطوات: الفئة، التفاصيل، التسعير، التأكيد',
      subtitle5: '٥ خطوات: الفئة، التفاصيل، الوسائط، التسعير، التأكيد',
      steps: { category: 'الفئة', details: 'التفاصيل', media: 'الوسائط', pricing: 'التسعير', confirm: 'تأكيد' },
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
      share: 'مشاركة',
      location: 'الموقع',
      approxIn: 'الموقع التقريبي في',
      video: 'فيديو',
      servicePrice: 'سعر الخدمة',
      serviceDuration: 'مدة الخدمة',
      serviceLocation: 'موقع الخدمة',
      viewOnMap: 'عرض على الخريطة',
      contactWhatsApp: 'تواصل عبر واتساب',
      callProvider: 'اتصل بالمقدّم',
      noContact: 'لم يتم توفير بيانات التواصل.',
      chatInApp: 'دردشة داخل التطبيق',
      requestService: 'طلب الخدمة',
      requestSent: 'تم إرسال الطلب',
      requestFailed: 'تعذّر إرسال الطلب',
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
      signInPrompt: 'سجّل الدخول لترك مراجعة.',
      ownerBlocked: 'لا يمكنك مراجعة خدمتك الخاصة.',
      empty: 'لا توجد مراجعات بعد.',
      toasts: {
        saved: 'تم حفظ المراجعة',
        deleted: 'تم حذف المراجعة',
        saveFailed: 'تعذّر حفظ المراجعة',
        deleteFailed: 'تعذّر حذف المراجعة',
        requiredRating: 'يرجى اختيار عدد النجوم.',
      },
    },

    form: {
      labels: {
        title: 'عنوان الخدمة',
        description: 'الوصف',
        category: 'الفئة',
        price: 'السعر (بالدينار الليبي)',
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
      },
      subservices: {
        label: 'الخدمات الفرعية',
        empty: 'لا توجد خدمات فرعية بعد.',
        title: 'العنوان',
        price: 'السعر',
        unit: 'الوحدة',
        unitPlaceholder: 'بالساعة / لكل قطعة',
        description: 'الوصف',
        descriptionPlaceholder: 'تفاصيل قصيرة…',
        add: 'إضافة خدمة فرعية',
        remove: 'حذف',
        total: 'مجموع الخدمات الفرعية',
        autoCalc: 'يتم احتساب السعر تلقائيًا من مجموع الخدمات الفرعية.',
      },
      placeholders: {
        title: 'مثال: صيانة وتكييف منازل باحترافية',
        description: 'صف خدمتك بالتفصيل...',
        availability: 'مثال: متاح مساءً وعطلات نهاية الأسبوع',
        searchAddress: 'ابحث عن عنوان أو مكان (مجاني)',
        contactPhone: 'مثال: ‎+218911234567',
        contactWhatsapp: 'مثال: ‎+218911234567',
      },
      help: {
        description: 'بحد أقصى 800 حرف. كن واضحًا ومختصرًا.',
        videoUrl: 'ألصق رابط يوتيوب وسيتم تضمينه في صفحة خدمتك.',
        imageTypes: 'PNG أو JPG أو WebP (حد أقصى 8 صور)',
        coverImage: 'ستكون الصورة الأولى هي صورة الغلاف الرئيسية للخدمة.',
      },
      actions: {
        improve: 'تحسين',
        useMyLocation: 'استخدم موقعي',
        clearLocation: 'مسح الموقع',
        clickToUpload: 'انقر للرفع أو اسحب وأفلت',
        createService: 'إنشاء الخدمة',
      },
      images: { selectedCount: 'تم اختيار {count} ملف: {names}' },
      toasts: {
        createdTitle: 'تم إنشاء الخدمة',
        createdDesc: 'تم نشر خدمتك بنجاح.',
        createFailedTitle: 'تعذّر إنشاء الخدمة',
      },
      map: {
        selected: 'المختار',
        clickToSet: 'انقر على الخريطة لتحديد موقع دقيق.',
        openInOSM: 'فتح في خريطة OSM',
      },
      geo: {
        notAvailableTitle: 'الموقع الجغرافي غير متاح',
        notAvailableDesc: 'متصفحك لا يدعم تحديد الموقع.',
      },
      ai: { suggestions: 'اقتراحات الذكاء الاصطناعي:' },
    },

    dashboard: {
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
          },
        },
        actions: { view: 'عرض', edit: 'تعديل', delete: 'حذف' },
        toast: {
          deleted: 'تم حذف الخدمة',
          deleteFailed: 'فشل الحذف',
          seeded: 'تم إنشاء خدمات تجريبية',
          seedFailed: 'فشل إضافة العينات',
        },
        confirmDelete:
          'هل تريد حذف هذه الخدمة؟ هذا الإجراء لا يمكن التراجع عنه.',
      },
      serviceForm: {
        newTitle: 'إنشاء خدمة جديدة',
        newSubtitle:
          'املأ التفاصيل أدناه لإضافة خدمتك في خدمتي كونكت.',
        editTitle: 'تعديل الخدمة',
        editSubtitle: 'قم بتحديث معلومات قائمتك.',
        saveChanges: 'حفظ التغييرات',
        saving: 'جارٍ الحفظ…',
        notAllowedTitle: 'غير مسموح',
        notAllowedDesc: 'يمكنك فقط تعديل خدماتك الخاصة.',
      },
      analytics: {
        title: 'تحليلاتي',
        subtitle: 'اعرض وأدر جميع قوائم تحليلاتك.',
        emptyTitle: 'لا توجد تحليلات بعد.',
        emptySubtitle:
          'اذهب إلى لوحة التحكم → خدماتي لإنشاء تحليل جديد.',
        table: {
          headers: {
            title: 'العنوان',
            category: 'الفئة',
            city: 'المدينة',
            price: 'السعر (د.ل)',
            actions: 'الإجراءات',
          },
        },
        actions: { view: 'عرض', edit: 'تعديل', delete: 'حذف' },
        toast: {
          deleted: 'تم حذف التحليل',
          deleteFailed: 'فشل الحذف',
        },
        confirmDelete:
          'هل تريد حذف هذا التحليل؟ هذا الإجراء لا يمكن التراجع عنه.',
      },
      profile: {
        title: 'الملف الشخصي',
        subtitle: 'قم بتحديث معلوماتك الشخصية.',
        saveChanges: 'حفظ التغييرات',
        saving: 'جارٍ الحفظ…',
        notAllowedTitle: 'غير مسموح',
        notAllowedDesc: 'يمكنك فقط تعديل خدماتك الخاصة.',
      },
      settings: {
        title: 'الإعدادات',
        subtitle: 'قم بتحديث إعداداتك.',
        saveChanges: 'حفظ التغييرات',
        saving: 'جارٍ الحفظ…',
        notAllowedTitle: 'غير مسموح',
        notAllowedDesc: 'يمكنك فقط تعديل خدماتك الخاصة.',
      },
      logout: 'تسجيل الخروج',
      login: 'تسجيل الدخول',
      register: 'تسجيل جديد',
    },

    map: { usingOSMBadge: 'يتم استخدام خرائط OpenStreetMap (مجاني)' },

    footer: {
      about: 'من نحن',
      terms: 'شروط الخدمة',
      privacy: 'سياسة الخصوصية',
      contact: 'تواصل معنا',
      rights: 'جميع الحقوق محفوظة.',
    },

    pages: {
      about: { title: 'حول خدمتي كونكت' },
      terms: { title: 'شروط الخدمة' },
      privacy: { title: 'سياسة الخصوصية' },
      contact: { title: 'اتصال' },
      pricing: {
        nav: 'الأسعار',
        title: 'أسعار بسيطة تنمو معك',
        subtitle:
          'اختر الخطة المناسبة لاحتياجاتك. يمكنك الترقية في أي وقت.',
        perMonth: 'شهريًا',
        choosePlan: 'اختيار الخطة',
        plans: {
          basic: { name: 'أساسي' },
          pro: { name: 'محترف' },
          enterprise: { name: 'مؤسسات' },
        },
        features: {
          basic: {
            l1: 'أضف خدماتك وتلقَّى تواصلًا',
            l2: 'تحليلات أساسية',
          },
          pro: {
            l1: 'تعزيز أولوية الظهور',
            l2: 'تحليلات متقدمة ورؤى',
            l3: 'طرق تواصل متعددة',
            l4: 'دعم عبر البريد/واتساب',
          },
          enterprise: {
            l1: 'تمييز بارز عبر الفئات',
            l2: 'حسابات فريق وصلاحيات',
            l3: 'إعداد مخصص وتدريب',
            l4: 'مدير نجاح مخصص',
          },
        },
      },
      checkout: {
        title: 'إتمام الدفع',
        subtitle: 'أكمل الدفع لتفعيل اشتراكك.',
        txId: 'معرّف العملية',
        plan: 'الخطة',
        amount: 'المبلغ',
        status: 'الحالة',
        statusLabels: {
          pending: 'قيد الانتظار',
          success: 'تم الدفع',
          failed: 'فشل',
          cancelled: 'أُلغيت',
        },
        scanHelp: 'امسح باستخدام تطبيق المحفظة',
        openWallet: 'فتح في تطبيق المحفظة',
        copyCode: 'نسخ رمز الدفع',
        refresh: 'لقد دفعت، تحديث',
        openWeb: 'فتح المحفظة (ويب)',
        openFail:
          'تعذّر فتح تطبيق المحفظة. إذا لم يكن مثبتًا، امسح رمز QR أو انسخ رمز الدفع.',
        desktopHint:
          'على الجوال، اضغط "فتح في تطبيق المحفظة". على الحاسوب، امسح رمز QR. ستتحدث هذه الصفحة تلقائيًا بعد تأكيد الدفع.',
        failedNotice:
          'فشلت عملية الدفع. الرجاء العودة إلى صفحة الأسعار والمحاولة مرة أخرى.',
        cancelledNotice:
          'تم إلغاء عملية الدفع. يمكنك المحاولة مرة أخرى من صفحة الأسعار.',
      },
    },
  },
} as const;


function get(obj: any, path: string): any {
  try {
    return path
      .split('.')
      .reduce(
        (acc: any, key: string) =>
          acc && typeof acc === 'object' ? acc[key] : undefined,
        obj
      );
  } catch {
    return undefined;
  }
}

export function tr(locale: Locale, key: string): string {
  try {
    // 1) Try requested locale first
    const primary = get((dict as any)[locale], key);
    if (typeof primary === 'string') return primary;

    // 2) Fallback to the other locale (English<->Arabic)
    const fallbackLocale: Locale = locale === 'ar' ? 'en' : 'ar';
    const fallback = get((dict as any)[fallbackLocale], key);
    if (typeof fallback === 'string') return fallback;

    // Log missing translations in development
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[i18n] Missing translation for key: "${key}" in locale: "${locale}"`
      );
    }

    // Default to key name if no translation found
    return key;
  } catch (error) {
    console.error(
      `[i18n] Error getting translation for key: "${key}"`,
      error
    );
    return key;
  }
}

export function getClientLocale(): Locale {
  try {
    // Return Arabic for server-side rendering
    if (typeof document === 'undefined') return 'ar';
    
    // Check cookie first
    const m = document.cookie.match(/(?:^|; )locale=([^;]+)/);
    if (m && m[1]) {
      return m[1].toLowerCase().startsWith('ar') ? 'ar' : 'en';
    }
    
    // If no cookie, check HTML lang attribute
    const htmlLang = document.documentElement.getAttribute('lang');
    if (htmlLang) {
      return htmlLang.toLowerCase().startsWith('ar') ? 'ar' : 'en';  
    }

    // Default to Arabic if no preference set
    return 'ar';
  } catch {
    return 'ar';
  }
}

export const dictionaries = dict;
