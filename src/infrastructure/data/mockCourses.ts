import { Course, Category, Flashcard } from '../../core/entities';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'all', name: 'Tất Cả Khóa Học', color: '#2E68FF', badgeBg: 'bg-blue-100 dark:bg-blue-900/40', badgeText: 'text-blue-600 dark:text-blue-400' },
  { id: 'web-dev', name: 'Lập Trình Web', color: '#7C5CFC', badgeBg: 'bg-purple-100 dark:bg-purple-900/40', badgeText: 'text-purple-600 dark:text-purple-400' },
  { id: 'ai-data', name: 'Trí Tuệ Nhân Tạo AI', color: '#6366F1', badgeBg: 'bg-indigo-100 dark:bg-indigo-900/40', badgeText: 'text-indigo-600 dark:text-indigo-400' },
  { id: 'english', name: 'Tiếng Anh & Ngoại Ngữ', color: '#0EA5C4', badgeBg: 'bg-cyan-100 dark:bg-cyan-900/40', badgeText: 'text-cyan-600 dark:text-cyan-400' },
  { id: 'ui-ux', name: 'Thiết Kế UI/UX', color: '#12B76A', badgeBg: 'bg-emerald-100 dark:bg-emerald-900/40', badgeText: 'text-emerald-600 dark:text-emerald-400' },
  { id: 'marketing', name: 'Marketing & Truyền Thông', color: '#F79009', badgeBg: 'bg-amber-100 dark:bg-amber-900/40', badgeText: 'text-amber-600 dark:text-amber-400' },
  { id: 'digital-mkt', name: 'Digital Marketing & SEO', color: '#EC4899', badgeBg: 'bg-pink-100 dark:bg-pink-900/40', badgeText: 'text-pink-600 dark:text-pink-400' },
  { id: 'finance', name: 'Tài Chính & Đầu Tư', color: '#2563EB', badgeBg: 'bg-blue-100 dark:bg-blue-900/40', badgeText: 'text-blue-600 dark:text-blue-400' },
  { id: 'soft-skills', name: 'Kỹ Năng Mềm', color: '#8B5CF6', badgeBg: 'bg-violet-100 dark:bg-violet-900/40', badgeText: 'text-violet-600 dark:text-violet-400' },
];

export const INITIAL_COURSES: Course[] = [
  {
    id: 'c1',
    youtubeUrl: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
    youtubeVideoId: 'kUMe1FH4CHE',
    title: 'Become a Certified Web Developer: HTML, CSS and JavaScript',
    description: 'Master full-stack frontend web architecture from basic markup to modern responsive design and async API integration.',
    category: 'Web Development',
    categoryId: 'web-dev',
    difficulty: 'Intermediate',
    thumbnailUrl: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?auto=format&fit=crop&w=800&q=80',
    channelName: 'CodeWithChris',
    durationText: '25 Videos • 4h 30m',
    totalLessons: 3,
    rating: 5.0,
    reviewsCount: 1840,
    badgeLabel: 'Featured',
    price: 140,
    originalPrice: 280,
    progressPercent: 35,
    createdAt: '2026-03-15',
    lessons: [
      {
        id: 'l1_1',
        lessonIndex: 1,
        title: 'Modern HTML5 Semantics & Accessible Document Structure',
        durationMinutes: 8,
        videoStartTime: '0:00',
        videoEndTime: '8:50',
        startSeconds: 0,
        endSeconds: 530,
        theoryContent: `
# Modern HTML5 & Web Semantics

Semantic HTML is the backbone of accessible and SEO-friendly web development. By using tags that convey meaning, screen readers and search engines can parse your content effortlessly.

### Key Structural Tags
- \`<header>\`: Container for introductory content or nav links.
- \`<main>\`: Specifies the primary dominant content of the document.
- \`<article>\`: Self-contained composition intended to be independently reusable.
- \`<section>\`: Standalone section of functionality or content.

\`\`\`html
<main>
  <article>
    <h1>Building Accessible UIs</h1>
    <p>Always pair semantic elements with appropriate ARIA attributes when needed.</p>
  </article>
</main>
\`\`\`
`,
        keyTakeaways: [
          'Use semantic HTML elements over generic divs for accessibility',
          'Include alt attributes for images to aid screen readers',
          'Proper heading hierarchy (H1 -> H2 -> H3) improves SEO ranking'
        ],
        quizQuestions: [
          {
            id: 'q1_1_1',
            question: 'Which tag should be used for the main, unique content of a webpage?',
            options: ['<section>', '<main>', '<content>', '<div>'],
            correctAnswer: 1,
            explanation: 'The <main> tag represents the dominant content of the <body> of a document that is unique to that document.'
          },
          {
            id: 'q1_1_2',
            question: 'What is the primary benefit of using semantic HTML5 tags?',
            options: [
              'It automatically applies CSS flexbox layout',
              'It improves accessibility, SEO, and maintainability',
              'It eliminates the need for JavaScript',
              'It speeds up database query times'
            ],
            correctAnswer: 1,
            explanation: 'Semantic elements clearly describe their meaning to both the browser and developer, aiding accessibility tools and search indexing.'
          },
          {
            id: 'q1_1_3',
            question: 'How should heading levels (H1 to H6) be structured on a page?',
            options: [
              'Skip directly from H1 to H4 if font size needs to be smaller',
              'Never skip heading levels sequentially (H1 -> H2 -> H3)',
              'Use H1 for all section titles',
              'Order does not matter as long as styling is applied'
            ],
            correctAnswer: 1,
            explanation: 'Maintaining a unbroken heading hierarchy allows assistive technologies to build an accurate outline of the page.'
          }
        ],
        dictationSegments: [
          {
            id: 'd1_1',
            segmentIndex: 1,
            startTime: 12,
            endTime: 22,
            targetText: 'Semantic tags provide meaning to both the browser and the user.',
            translationText: 'Thẻ ngữ nghĩa cung cấp ý nghĩa cho cả trình duyệt và người dùng.',
            hintKeyWords: ['Semantic', 'browser', 'meaning']
          },
          {
            id: 'd1_2',
            segmentIndex: 2,
            startTime: 45,
            endTime: 56,
            targetText: 'Accessibility should be baked in from the very first line of code.',
            translationText: 'Khả năng truy cập cần được tích hợp ngay từ dòng code đầu tiên.',
            hintKeyWords: ['Accessibility', 'baked', 'first line']
          }
        ],
        shadowingLines: [
          {
            id: 's1_1',
            segmentIndex: 1,
            startTime: 15,
            endTime: 25,
            sampleText: 'Building accessible web apps opens up opportunities for millions of users worldwide.',
            phoneticText: '/ˈbɪldɪŋ əkˈsɛsəbl wɛb æps ˈoʊpənz ʌp ˌɑpərˈtunətiz/'
          }
        ],
        writingPrompt: {
          id: 'w1_1',
          promptText: 'Explain why semantic HTML is important for modern search engine optimization (SEO) and web accessibility in 100-150 words.',
          suggestedWordCount: 120,
          sampleAnswer: 'Semantic HTML is vital because search engines rely on structural tags like <article> and <nav> to index site hierarchy efficiently. Furthermore, screen readers depend on these tags to navigate documents for visually impaired users.'
        },
        speakingPrompt: {
          id: 'sp1_1',
          promptText: 'Record a 30-second explanation comparing the difference between <div> and <article> tags.',
          phoneticGuide: 'Speak clearly with enthusiasm, emphasizing <article> for self-contained content.'
        },
        availableModes: ['theory', 'quiz', 'dictation', 'shadowing', 'writing', 'speaking'],
        completedModes: ['theory', 'quiz']
      },
      {
        id: 'l1_2',
        lessonIndex: 2,
        title: 'Flexbox vs CSS Grid Layout Architecture',
        durationMinutes: 10,
        videoStartTime: '8:50',
        videoEndTime: '18:50',
        startSeconds: 530,
        endSeconds: 1130,
        theoryContent: `
# Flexbox & CSS Grid Mechanics

Understanding when to use Flexbox versus CSS Grid is a superpower for frontend engineers.

- **Flexbox (1D Layout)**: Designed for alignment along a single axis (either row OR column). Ideal for navigation bars, button groups, and card component contents.
- **CSS Grid (2D Layout)**: Designed for complex layouts with rows AND columns simultaneously. Perfect for overall page layouts, image galleries, and bento grids.
`,
        keyTakeaways: [
          'Flexbox handles one-dimensional row or column flows',
          'Grid controls two-dimensional layouts with track sizing',
          'Combine flex containers inside grid items for responsive layouts'
        ],
        quizQuestions: [
          {
            id: 'q1_2_1',
            question: 'Which layout model is best suited for a two-dimensional grid with rows AND columns?',
            options: ['Flexbox', 'CSS Grid', 'Float layout', 'Absolute positioning'],
            correctAnswer: 1,
            explanation: 'CSS Grid was created specifically to solve two-dimensional layout requirements with simultaneous row and column tracks.'
          },
          {
            id: 'q1_2_2',
            question: 'When should you choose Flexbox over CSS Grid?',
            options: [
              'When aligning items along a single axis (row or column)',
              'When building complex 3D perspective animations',
              'When connecting to an SQL database',
              'When styling static HTML tables'
            ],
            correctAnswer: 0,
            explanation: 'Flexbox excels at 1D layout distribution such as navigation bars, button stacks, and card component headers.'
          },
          {
            id: 'q1_2_3',
            question: 'What happens when you apply "flex-wrap: wrap" to a flex container?',
            options: [
              'Flex items shrink infinitely without breaking line',
              'Flex items wrap onto multiple lines when available width is exceeded',
              'Flex items convert automatically into CSS Grid columns',
              'All margins are reduced to zero'
            ],
            correctAnswer: 1,
            explanation: 'flex-wrap: wrap allows flex items to wrap onto new lines as space decreases, maintaining child min-width.'
          },
          {
            id: 'q1_2_4',
            question: 'What is the purpose of "gap" in CSS Grid and Flexbox?',
            options: [
              'Sets inner padding inside child items',
              'Controls spacing between adjacent grid/flex items without margin collisions',
              'Adds a colored line divider between items',
              'Defines border radius for container edges'
            ],
            correctAnswer: 1,
            explanation: 'The gap property cleanly creates gutters between rows and columns without affecting outer edges.'
          }
        ],
        dictationSegments: [
          {
            id: 'd1_2_1',
            segmentIndex: 1,
            startTime: 540,
            endTime: 552,
            targetText: 'Flexbox works along one dimension while Grid handles two dimensions.',
            translationText: 'Flexbox hoạt động theo một chiều trong khi Grid xử lý hai chiều.',
            hintKeyWords: ['Flexbox', 'dimension', 'Grid']
          }
        ],
        shadowingLines: [
          {
            id: 's1_2_1',
            segmentIndex: 1,
            startTime: 560,
            endTime: 572,
            sampleText: 'Mastering modern layout techniques eliminates the need for legacy float hacks.',
            phoneticText: '/ˈmæstərɪŋ ˈmɑdərn ˈleɪˌaʊt tɛkˈniks/'
          }
        ],
        availableModes: ['theory', 'quiz', 'dictation', 'shadowing', 'writing', 'speaking'],
        completedModes: []
      }
    ]
  },
  {
    id: 'c2',
    youtubeUrl: 'https://www.youtube.com/watch?v=3nQNiWdeH2Q',
    youtubeVideoId: '3nQNiWdeH2Q',
    title: 'A Digital Marketing (DMS) Method With Communication',
    description: 'Learn modern digital marketing strategy, social media funnel design, conversion optimization, and brand narrative techniques.',
    category: 'Marketing & Communication',
    categoryId: 'marketing',
    difficulty: 'Beginner',
    thumbnailUrl: 'https://images.unsplash.com/photo-1557838923-2985c318be48?auto=format&fit=crop&w=800&q=80',
    channelName: 'MarketingPro HQ',
    durationText: '20 Videos • 3h 45m',
    totalLessons: 2,
    rating: 5.0,
    reviewsCount: 2180,
    badgeLabel: 'Best Seller',
    price: 120,
    originalPrice: 240,
    progressPercent: 0,
    createdAt: '2026-03-10',
    lessons: [
      {
        id: 'l2_1',
        lessonIndex: 1,
        title: 'Building a Customer-Centric Marketing Funnel',
        durationMinutes: 12,
        videoStartTime: '0:00',
        videoEndTime: '12:00',
        startSeconds: 0,
        endSeconds: 720,
        theoryContent: `
# Digital Marketing Funnel Blueprint

A marketing funnel outlines the journey potential customers take from first discovering your brand to becoming loyal advocates.

### The 4 Main Stages
1. **Awareness (Top of Funnel - TOFU)**: Reaching target audiences via social content, ads, and search SEO.
2. **Interest (Middle of Funnel - MOFU)**: Engaging prospects with newsletters, case studies, and demos.
3. **Decision (Bottom of Funnel - BOFU)**: Converting leads with discounts, free trials, and social proof.
4. **Retention**: Keeping existing customers happy with community support and loyalty perks.
`,
        keyTakeaways: [
          'Tailor messaging specifically to each funnel stage',
          'Top of funnel should focus on value education rather than hard selling',
          'Social proof (reviews & testimonials) boosts bottom-funnel conversion by up to 340%'
        ],
        quizQuestions: [
          {
            id: 'q2_1_1',
            question: 'What is the primary goal of the Awareness (TOFU) stage in a marketing funnel?',
            options: [
              'To ask for an immediate credit card payment',
              'To educate prospects and introduce your brand value',
              'To send aggressive promotional SMS discounts',
              'To delete inactive subscribers'
            ],
            correctAnswer: 1,
            explanation: 'Top of funnel content aims to solve problems and build initial trust before asking for a purchase decision.'
          },
          {
            id: 'q2_1_2',
            question: 'Which type of content works best at the Middle of Funnel (MOFU) stage?',
            options: [
              'Case studies, product demos, and comparison guides',
              'Short 5-second unbranded meme videos',
              'Receipt invoices',
              'Terms of service legal documentation'
            ],
            correctAnswer: 0,
            explanation: 'MOFU prospects are actively evaluating solutions; case studies and detailed comparison guides build credibility.'
          },
          {
            id: 'q2_1_3',
            question: 'How much can authentic social proof and reviews increase bottom-funnel conversion rate?',
            options: ['Up to 10%', 'Up to 50%', 'Up to 340%', 'It has no effect on buyers'],
            correctAnswer: 2,
            explanation: 'Customer testimonials and ratings reassure hesitant decision-stage buyers, increasing conversions up to 340%.'
          },
          {
            id: 'q2_1_4',
            question: 'What metric evaluates the cost incurred to acquire a single paying customer?',
            options: ['CAC (Customer Acquisition Cost)', 'CTR (Click-Through Rate)', 'LTV (Lifetime Value)', 'NPS (Net Promoter Score)'],
            correctAnswer: 0,
            explanation: 'CAC represents the total marketing and sales expense spent divided by total new customers acquired.'
          }
        ],
        dictationSegments: [
          {
            id: 'd2_1_1',
            segmentIndex: 1,
            startTime: 30,
            endTime: 42,
            targetText: 'A well structured funnel transforms casual browsers into loyal customers.',
            translationText: 'Một phễu bán hàng được cấu trúc tốt biến người xem vãng lai thành khách hàng trung thành.',
            hintKeyWords: ['funnel', 'browsers', 'customers']
          }
        ],
        shadowingLines: [
          {
            id: 's2_1_1',
            segmentIndex: 1,
            startTime: 45,
            endTime: 58,
            sampleText: 'Focus on solving problems for your audience before pitching products.',
            phoneticText: '/ˈfoʊkəs ɑn ˈsɑlvɪŋ ˈprɑbləmz fɔr jʊər ˈɑdiəns/'
          }
        ],
        availableModes: ['theory', 'quiz', 'dictation', 'shadowing', 'writing', 'speaking'],
        completedModes: []
      }
    ]
  },
  {
    id: 'c3',
    youtubeUrl: 'https://www.youtube.com/watch?v=c9Wg6Cb_YlU',
    youtubeVideoId: 'c9Wg6Cb_YlU',
    title: 'Advance Figma Prototyping For UI/UX Designer',
    description: 'Elevate your UI design craft with variables, component variants, smart animations, auto-layout 5.0, and interactive design systems.',
    category: 'UI/UX Design',
    categoryId: 'ui-ux',
    difficulty: 'Advanced',
    thumbnailUrl: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=800&q=80',
    channelName: 'DesignAcademy',
    durationText: '34 Videos • 5h 10m',
    totalLessons: 2,
    rating: 5.0,
    reviewsCount: 5200,
    badgeLabel: 'Top Rated',
    price: 100,
    originalPrice: 200,
    progressPercent: 75,
    createdAt: '2026-03-01',
    lessons: [
      {
        id: 'l3_1',
        lessonIndex: 1,
        title: 'Figma Auto-Layout & Mathematical Spacing Systems',
        durationMinutes: 15,
        videoStartTime: '0:00',
        videoEndTime: '15:00',
        startSeconds: 0,
        endSeconds: 900,
        theoryContent: `
# Figma Auto-Layout Masterclass

Auto-layout allows components to adapt fluidly as text or nested elements change.

### The 8pt Grid & Nested Radius Formula
- Use an 8-pixel spacing scale (8px, 16px, 24px, 32px, 48px).
- **Nested Border Radius Rule**: \`Inner Radius = Outer Radius - Padding\`.
- Maintain consistent visual hierarchy across light & dark themes.
`,
        keyTakeaways: [
          'Calculate inner border radius mathematically to prevent visual awkwardness',
          'Use Auto-layout min/max width bounds for responsive frame scaling',
          'Store design tokens in variables for seamless dark mode toggling'
        ],
        quizQuestions: [
          {
            id: 'q3_1_1',
            question: 'If a parent container has an outer border radius of 20px and 8px padding, what should the inner child radius be?',
            options: ['20px', '12px', '8px', '28px'],
            correctAnswer: 1,
            explanation: 'Inner Radius = Outer Radius (20px) - Padding (8px) = 12px.'
          },
          {
            id: 'q3_1_2',
            question: 'What spacing scale is recommended as an industry baseline for UI layout math?',
            options: ['3px incremental scale', '8px / 4px grid scale', '17px prime scale', 'Arbitrary pixel sizing'],
            correctAnswer: 1,
            explanation: 'An 8px grid (with 4px for fine-grained alignment) ensures consistent visual harmony across screen sizes.'
          },
          {
            id: 'q3_1_3',
            question: 'Why should you use Figma Variables over hardcoded hex values for colors?',
            options: [
              'Variables automatically export code to C++',
              'Variables enable dynamic dark mode switching and unified theme tokens',
              'Variables increase prototype rendering speed by 10x',
              'Variables remove all layers from canvas'
            ],
            correctAnswer: 1,
            explanation: 'Figma Variables act as design tokens, allowing instant switching between light/dark modes and multi-brand themes.'
          },
          {
            id: 'q3_1_4',
            question: 'What is the purpose of "Hug Contents" in Figma Auto-Layout?',
            options: [
              'Forces the container size to expand or shrink to tightly wrap its children',
              'Locks the frame to a rigid width',
              'Stretches children to fill parent height',
              'Turns the container invisible'
            ],
            correctAnswer: 0,
            explanation: 'Hug Contents resizes the auto-layout frame dynamically based on its nested child elements and padding.'
          }
        ],
        dictationSegments: [
          {
            id: 'd3_1_1',
            segmentIndex: 1,
            startTime: 20,
            endTime: 32,
            targetText: 'Design tokens make maintaining consistent visual hierarchy effortless.',
            translationText: 'Design token giúp việc duy trì hệ thống phân cấp thị giác trở nên dễ dàng.',
            hintKeyWords: ['Design tokens', 'consistent', 'hierarchy']
          }
        ],
        shadowingLines: [
          {
            id: 's3_1_1',
            segmentIndex: 1,
            startTime: 35,
            endTime: 48,
            sampleText: 'Great UI design balances aesthetic harmony with clear functional usability.',
            phoneticText: '/greɪt ˌjuːˈaɪ dɪˈzaɪn ˈbælənsɪz ɛsˈθɛtɪk ˈhɑːməni/'
          }
        ],
        availableModes: ['theory', 'quiz', 'dictation', 'shadowing', 'writing', 'speaking'],
        completedModes: ['theory', 'quiz', 'dictation']
      }
    ]
  },
  {
    id: 'c4',
    youtubeUrl: 'https://www.youtube.com/watch?v=WEdA4Xg0b4A',
    youtubeVideoId: 'WEdA4Xg0b4A',
    title: 'The Complete Financial Analyst Training And Investing',
    description: 'Learn financial modeling, discounted cash flow valuation, balance sheet analysis, and startup capital management.',
    category: 'Finance Management',
    categoryId: 'finance',
    difficulty: 'Advanced',
    thumbnailUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80',
    channelName: 'WallStreetAcademy',
    durationText: '40 Videos • 6h 15m',
    totalLessons: 2,
    rating: 5.0,
    reviewsCount: 4300,
    badgeLabel: 'Popular',
    price: 240,
    originalPrice: 480,
    progressPercent: 10,
    createdAt: '2026-02-28',
    lessons: [
      {
        id: 'l4_1',
        lessonIndex: 1,
        title: 'Understanding Financial Statements: Income, Balance & Cash Flow',
        durationMinutes: 14,
        videoStartTime: '0:00',
        videoEndTime: '14:00',
        startSeconds: 0,
        endSeconds: 840,
        theoryContent: `
# Three Core Financial Statements

1. **Income Statement**: Shows revenue, expenses, and net profit over a specific period.
2. **Balance Sheet**: Snapshots assets, liabilities, and shareholders equity at a point in time.
3. **Cash Flow Statement**: Tracks actual cash movement across Operating, Investing, and Financing activities.
`,
        keyTakeaways: [
          'Cash flow is king: a profitable company can still go bankrupt without cash liquidity',
          'Assets = Liabilities + Equity must always balance',
          'EBITDA measures core operational earnings before financing choices'
        ],
        quizQuestions: [
          {
            id: 'q4_1_1',
            question: 'Which statement tracks actual physical cash inflows and outflows rather than accrual accounting?',
            options: ['Income Statement', 'Balance Sheet', 'Cash Flow Statement', 'Retained Earnings Statement'],
            correctAnswer: 2,
            explanation: 'The Cash Flow Statement details how cash was generated and spent during an accounting period.'
          }
        ],
        dictationSegments: [
          {
            id: 'd4_1_1',
            segmentIndex: 1,
            startTime: 25,
            endTime: 38,
            targetText: 'Cash liquidity is essential for surviving unexpected market down cycles.',
            translationText: 'Thanh khoản tiền mặt là yếu tố thiết yếu để vượt qua các chu kỳ suy thoái bất ngờ.',
            hintKeyWords: ['Cash liquidity', 'surviving', 'market']
          }
        ],
        shadowingLines: [
          {
            id: 's4_1_1',
            segmentIndex: 1,
            startTime: 40,
            endTime: 52,
            sampleText: 'Analyzing financial health requires looking beyond superficial revenue numbers.',
            phoneticText: '/ˈænəlˌaɪzɪŋ faɪˈnænʃəl hɛlθ rɪˈkwaɪərz/'
          }
        ],
        availableModes: ['theory', 'quiz', 'dictation', 'shadowing', 'writing', 'speaking'],
        completedModes: []
      }
    ]
  },
  {
    id: 'c5',
    youtubeUrl: 'https://www.youtube.com/watch?v=0SJE9dYdpps',
    youtubeVideoId: '0SJE9dYdpps',
    title: 'UI Design: Create a Modern Website in Figma',
    description: 'Step-by-step hands-on guide building a commercial landing page with clean typography, negative space, and responsive breakpoints.',
    category: 'UI/UX Design',
    categoryId: 'ui-ux',
    difficulty: 'Beginner',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80',
    channelName: 'Flux Academy',
    durationText: '18 Videos • 3h 10m',
    totalLessons: 2,
    rating: 5.0,
    reviewsCount: 1800,
    badgeLabel: 'Featured',
    price: 160,
    originalPrice: 320,
    progressPercent: 50,
    createdAt: '2026-03-05',
    lessons: [
      {
        id: 'l5_1',
        lessonIndex: 1,
        title: 'Crafting Hero Sections & Visual Focal Points',
        durationMinutes: 10,
        videoStartTime: '0:00',
        videoEndTime: '10:00',
        startSeconds: 0,
        endSeconds: 600,
        theoryContent: `
# Hero Section Anatomy

The hero fold is your product's first impression.
- Clear value proposition in H1 display typography.
- Primary CTA pill button with distinct contrast.
- Visual anchor image or interactive element.
`,
        keyTakeaways: [
          'Limit hero subheadings to 20-25 words maximum',
          'Use 1.333 Perfect Fourth scale for strong typographic contrast',
          'Ensure touch targets are at least 44px on mobile displays'
        ],
        quizQuestions: [
          {
            id: 'q5_1_1',
            question: 'What is the recommended minimum touch target size for mobile buttons?',
            options: ['24px', '32px', '44px', '60px'],
            correctAnswer: 2,
            explanation: '44px x 44px ensures comfortable tapping without accidental misclicks.'
          }
        ],
        dictationSegments: [
          {
            id: 'd5_1_1',
            segmentIndex: 1,
            startTime: 15,
            endTime: 28,
            targetText: 'The hero fold determines whether a visitor stays or bounces from your site.',
            translationText: 'Phần hero đầu trang quyết định người dùng ở lại hay rời khỏi trang.',
            hintKeyWords: ['hero fold', 'visitor', 'bounces']
          }
        ],
        shadowingLines: [
          {
            id: 's5_1_1',
            segmentIndex: 1,
            startTime: 30,
            endTime: 42,
            sampleText: 'Clear typography and generous whitespace lead to effortless visual scanability.',
            phoneticText: '/klɪər taɪˈpɑːɡrəfi ænd ˈʤɛnərəs ˈwaɪtˌspeɪs/'
          }
        ],
        availableModes: ['theory', 'quiz', 'dictation', 'shadowing', 'writing', 'speaking'],
        completedModes: ['theory']
      }
    ]
  },
  {
    id: 'c6',
    youtubeUrl: 'https://www.youtube.com/watch?v=J---aiyznGQ',
    youtubeVideoId: 'J---aiyznGQ',
    title: 'SEO Basics for Beginners: Content, AI and Growth Planning',
    description: 'Learn modern search engine optimization, keyword search intent, on-page schema markup, and AI-assisted content strategy.',
    category: 'Digital Marketing',
    categoryId: 'digital-mkt',
    difficulty: 'Beginner',
    thumbnailUrl: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&w=800&q=80',
    channelName: 'Ahrefs Channel',
    durationText: '14 Videos • 2h 50m',
    totalLessons: 2,
    rating: 5.0,
    reviewsCount: 1800,
    badgeLabel: 'Top Rated',
    price: 180,
    originalPrice: 360,
    progressPercent: 0,
    createdAt: '2026-03-12',
    lessons: [
      {
        id: 'l6_1',
        lessonIndex: 1,
        title: 'Keyword Research & Search Intent Categorization',
        durationMinutes: 11,
        videoStartTime: '0:00',
        videoEndTime: '11:00',
        startSeconds: 0,
        endSeconds: 660,
        theoryContent: `
# Search Intent Classification

Search engines rank pages based on how accurately they satisfy search intent.

1. **Informational**: User wants to learn ("how to build a website").
2. **Navigational**: User wants to find a specific page ("YouTube login").
3. **Commercial**: User is researching before buying ("best web dev course 2026").
4. **Transactional**: User wants to complete a purchase ("buy Figma Pro license").
`,
        keyTakeaways: [
          'Match content format directly to the user search intent',
          'Optimize page load speed for core web vitals ranking factors',
          'Use structured JSON-LD schema for rich search snippets'
        ],
        quizQuestions: [
          {
            id: 'q6_1_1',
            question: 'What search intent category applies to "how to fix flexbox overflow"?',
            options: ['Transactional', 'Informational', 'Navigational', 'Commercial'],
            correctAnswer: 1,
            explanation: 'The user is looking to learn and solve a problem, making it Informational intent.'
          }
        ],
        dictationSegments: [
          {
            id: 'd6_1_1',
            segmentIndex: 1,
            startTime: 20,
            endTime: 32,
            targetText: 'Satisfying user search intent is the single most critical ranking factor.',
            translationText: 'Thỏa mãn ý định tìm kiếm của người dùng là yếu tố xếp hạng quan trọng nhất.',
            hintKeyWords: ['search intent', 'critical', 'ranking factor']
          }
        ],
        shadowingLines: [
          {
            id: 's6_1_1',
            segmentIndex: 1,
            startTime: 35,
            endTime: 48,
            sampleText: 'High quality content that directly answers user queries will naturally earn authority.',
            phoneticText: '/haɪ ˈkwɑːləti ˈkɑːntɛnt ðæt dɪˈrɛktli ˈænsərz/'
          }
        ],
        availableModes: ['theory', 'quiz', 'dictation', 'shadowing', 'writing', 'speaking'],
        completedModes: []
      }
    ]
  }
];
