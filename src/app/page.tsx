'use client';

import { Icon } from '@iconify/react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-sans text-[#171a1f]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-[#dee1e6] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#01696F]">
                <svg data-svg-id="SVG_1" className="h-[22px] w-[22px] text-white" viewBox="0 0 22 22">
            <g transform="matrix(1 0 0 1 0 0)">
              <g style={{  }}>
                <g transform="matrix(0.92 0 0 0.92 11.01 9.17)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(255,255,255)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12.01, -10)" d="M 12.0002 3.99963 C 12.4297 3.99966 12.8545 4.09189 13.2453 4.27014 L 13.2443 4.27112 L 21.8156 8.17346 L 21.8147 8.17444 C 22.1632 8.32627 22.4622 8.57366 22.675 8.88928 C 22.8936 9.21358 23.0117 9.59491 23.0158 9.98596 C 23.0199 10.3772 22.9094 10.7615 22.6975 11.0905 C 22.4873 11.4166 22.1863 11.6734 21.8322 11.8317 L 21.8332 11.8326 L 13.2434 15.7311 C 12.9018 15.8866 12.5342 15.9757 12.1604 15.9957 L 12.0002 16.0006 C 11.6244 16.0006 11.2524 15.9296 10.9035 15.7926 L 10.7551 15.7301 L 2.18477 11.8219 L 2.18477 11.8209 C 1.83498 11.6644 1.53717 11.4114 1.32735 11.0905 C 1.11465 10.7651 1.00117 10.3844 1.00117 9.99573 C 1.00123 9.60717 1.11476 9.22723 1.32735 8.90198 C 1.53745 8.58058 1.8353 8.32601 2.18575 8.16956 L 10.7551 4.27112 L 10.7551 4.27014 C 11.1459 4.09189 11.5706 3.99963 12.0002 3.99963 Z M 3.01485 10.0026 L 11.5852 13.9098 L 11.6848 13.9489 C 11.7863 13.9826 11.8928 14.0006 12.0002 14.0006 L 12.1066 13.9948 C 12.2131 13.9833 12.3174 13.9544 12.4152 13.9098 L 12.4172 13.9098 L 21.007 10.0114 L 21.0168 10.0074 C 21.0068 10.0033 20.9964 9.99828 20.9865 9.99377 L 12.4152 6.09045 L 12.4152 6.08948 C 12.285 6.03008 12.1433 5.99966 12.0002 5.99963 C 11.8929 5.99963 11.7862 6.01673 11.6848 6.05042 L 11.5852 6.08948 L 11.5842 6.09045 L 3.01387 9.98987 L 3.00117 9.99573 L 3.01485 10.0026 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(0.92 0 0 0.92 20.17 11.92)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(255,255,255)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-22, -13)" d="M 21 16 L 21 10 C 21 9.44772 21.4477 9 22 9 C 22.5523 9 23 9.44772 23 10 L 23 16 C 23 16.5523 22.5523 17 22 17 C 21.4477 17 21 16.5523 21 16 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(0.92 0 0 0.92 11 14.44)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(255,255,255)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -15.75)" d="M 5 16 L 5 12.5 C 5 11.9477 5.44772 11.5 6 11.5 C 6.55228 11.5 7 11.9477 7 12.5 L 7 16 L 7.01074 16.0967 C 7.06328 16.3502 7.32825 16.7885 8.2041 17.2266 C 9.15862 17.7038 10.5239 18 12 18 L 12.5479 17.9863 C 13.8109 17.9232 14.9607 17.6442 15.7959 17.2266 C 16.7968 16.726 17 16.225 17 16 L 17 12.5 C 17 11.9477 17.4477 11.5 18 11.5 C 18.5523 11.5 19 11.9477 19 12.5 L 19 16 C 19 17.3662 17.9386 18.3911 16.6895 19.0156 C 15.4745 19.623 13.9156 19.9568 12.3193 19.9961 L 12 20 C 10.2936 20 8.60643 19.6635 7.31055 19.0156 C 6.13943 18.4301 5.13377 17.4927 5.0127 16.252 L 5 16 Z" strokeLinecap="round" />
                </g>
              </g>
            </g>
          </svg>
              </div>
              <span className="text-xl font-bold tracking-tight text-[#01696F]">Topper101</span>
            </div>
            <div className="hidden items-center gap-6 md:flex">
              <a href="#" className="text-sm font-medium text-[#565d6d] hover:text-[#01696F]">Question Bank</a>
              <a href="#" className="text-sm font-medium text-[#565d6d] hover:text-[#01696F]">Concept Tree</a>
              <a href="#" className="text-sm font-medium text-[#565d6d] hover:text-[#01696F]">Study Planner</a>
              <a href="#" className="text-sm font-medium text-[#565d6d] hover:text-[#01696F]">Exam Eve</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-sm font-medium text-[#171a1f] hover:text-[#01696F]">Sign in</button>
            <button className="rounded-full bg-[#01696F] px-5 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#01696F]/90">
              Start Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-32 lg:pb-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div className="z-10">
              <div className="mb-6 inline-flex items-center rounded-full bg-[#01696F]/10 px-4 py-1">
                <span className="text-sm font-medium text-[#01696F]">IGNOU MAPC Exams are 10 weeks away</span>
              </div>
              <h1 className="mb-6 text-5xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
                Stop guessing.<br />
                Start passing with <span className="text-[#01696F]">AI-driven</span> insights.
              </h1>
              <p className="mb-10 max-w-xl text-lg leading-relaxed text-[#565d6d] lg:text-xl">
                Topper101 analyzes past papers to give you the highest-probability questions, instant AI answers, and a personalized study plan tailored to your exam date.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <button className="flex items-center justify-center gap-2 rounded-full bg-[#01696F] px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:scale-[1.02] hover:bg-[#01696F]/90">
                  Try it free — no card needed
                  <svg data-svg-id="SVG_4" className="h-5 w-5 text-white" viewBox="0 0 20 20">
          <g transform="matrix(1 0 0 1 0 0)">
            <g style={{  }}>
              <g transform="matrix(0.83 0 0 0.83 10 10)">
                <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(255,255,255)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 8.29295 5.29298 C 8.65907 4.92686 9.23807 4.90427 9.63084 5.22462 L 9.70702 5.29298 L 15.707 11.293 C 16.0975 11.6835 16.0975 12.3165 15.707 12.707 L 9.70702 18.707 C 9.31649 19.0976 8.68348 19.0976 8.29295 18.707 C 7.90243 18.3165 7.90243 17.6835 8.29295 17.293 L 13.5859 12 L 8.29295 6.70704 L 8.22459 6.63087 C 7.90424 6.2381 7.92684 5.65909 8.29295 5.29298 Z" strokeLinecap="round" />
              </g>
            </g>
          </g>
        </svg>
                </button>
                <button className="rounded-full border border-[#dee1e6] bg-white px-8 py-4 text-base font-semibold text-[#171a1f] transition-all hover:bg-gray-50">
                  View Pricing
                </button>
              </div>
              <div className="mt-8 flex items-center gap-2 text-sm text-[#565d6d]">
                <svg data-svg-id="SVG_5" className="h-4 w-4 text-[#01696F]" viewBox="0 0 16 16">
        <g transform="matrix(1 0 0 1 0 0)">
          <g style={{  }}>
            <g transform="matrix(0.67 0 0 0.67 8 8)">
              <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(31,158,249)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 21 12 C 21 7.02944 16.9706 3 12 3 C 7.02944 3 3 7.02944 3 12 C 3 16.9706 7.02944 21 12 21 C 16.9706 21 21 16.9706 21 12 Z M 23 12 C 23 18.0751 18.0751 23 12 23 C 5.92487 23 1 18.0751 1 12 C 1 5.92487 5.92487 1 12 1 C 18.0751 1 23 5.92487 23 12 Z" strokeLinecap="round" />
            </g>
            <g transform="matrix(0.67 0 0 0.67 8 8)">
              <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(31,158,249)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 14.3692 9.22462 C 14.7619 8.90427 15.3409 8.92686 15.707 9.29298 C 16.0732 9.65909 16.0958 10.2381 15.7754 10.6309 L 15.707 10.707 L 11.707 14.707 C 11.3409 15.0732 10.7619 15.0958 10.3692 14.7754 L 10.293 14.707 L 8.29298 12.707 L 8.22462 12.6309 C 7.90427 12.2381 7.92686 11.6591 8.29298 11.293 C 8.65909 10.9269 9.2381 10.9043 9.63087 11.2246 L 9.70704 11.293 L 11 12.5859 L 14.293 9.29298 L 14.3692 9.22462 Z" strokeLinecap="round" />
            </g>
          </g>
        </g>
      </svg>
                <span>Join 5,000+ MAPC students upgrading their scores.</span>
              </div>
            </div>

            <div className="relative lg:ml-12">
              {/* Glow Effect */}
              <div className="absolute -inset-4 z-0 rounded-2xl bg-gradient-to-tr from-[#01696F]/20 to-transparent blur-3xl"></div>
              
              {/* Floating Tag */}
              <div className="absolute -top-8 -right-4 z-20 flex items-center gap-3 rounded-2xl border border-[#dee1e6] bg-white p-4 shadow-xl md:right-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50">
                  <svg data-svg-id="SVG_2" className="h-5 w-5 text-[#171a1f]" viewBox="0 0 20 20">
            <g transform="matrix(1 0 0 1 0 0)">
              <g style={{  }}>
                <g transform="matrix(0.83 0 0 0.83 10 10)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(23,26,31)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 21 12 C 21 7.02944 16.9706 3 12 3 C 7.02944 3 3 7.02944 3 12 C 3 16.9706 7.02944 21 12 21 C 16.9706 21 21 16.9706 21 12 Z M 23 12 C 23 18.0751 18.0751 23 12 23 C 5.92487 23 1 18.0751 1 12 C 1 5.92487 5.92487 1 12 1 C 18.0751 1 23 5.92487 23 12 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(0.83 0 0 0.83 10 10)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(23,26,31)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 17 12 C 17 9.23858 14.7614 7 12 7 C 9.23858 7 7 9.23858 7 12 C 7 14.7614 9.23858 17 12 17 C 14.7614 17 17 14.7614 17 12 Z M 19 12 C 19 15.866 15.866 19 12 19 C 8.13401 19 5 15.866 5 12 C 5 8.13401 8.13401 5 12 5 C 15.866 5 19 8.13401 19 12 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(0.83 0 0 0.83 10 10)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(23,26,31)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 13 12 C 13 11.4477 12.5523 11 12 11 C 11.4477 11 11 11.4477 11 12 C 11 12.5523 11.4477 13 12 13 C 12.5523 13 13 12.5523 13 12 Z M 15 12 C 15 13.6569 13.6569 15 12 15 C 10.3431 15 9 13.6569 9 12 C 9 10.3431 10.3431 9 12 9 C 13.6569 9 15 10.3431 15 12 Z" strokeLinecap="round" />
                </g>
              </g>
            </g>
          </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-[#171a1f]">High Probability</p>
                  <p className="text-[10px] text-[#565d6d]">Appeared in last 3 terms</p>
                </div>
              </div>

              {/* AI Card */}
              <div className="relative z-10 overflow-hidden rounded-xl border border-[#dee1e6] bg-white/95 shadow-2xl backdrop-blur-sm">
                <div className="bg-[#f3f4f6]/30 p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#565d6d]">MPC-001 • Cognitive Psychology</span>
                    <div className="rounded-full border border-[#dee1e6] bg-white px-3 py-0.5 text-[10px] font-medium text-[#404040]">10 Marks</div>
                    <div className="flex items-center gap-1 rounded-full bg-[#01696F]/10 px-3 py-0.5 text-[10px] font-bold text-[#01696F]">
                      <svg data-svg-id="SVG_3" className="h-3 w-3" viewBox="0 0 12 12">
                    <g transform="matrix(1 0 0 1 0 0)">
                      <g style={{  }}>
                        <g transform="matrix(0.5 0 0 0.5 6 6)">
                          <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(31,158,249)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 13.3511 1.00426 C 13.6035 0.979434 13.8584 1.01916 14.0913 1.11949 L 14.2056 1.17516 L 14.315 1.23961 C 14.5276 1.37773 14.7014 1.56768 14.8208 1.79137 L 14.8765 1.90563 L 14.9214 2.02477 C 15.0012 2.26511 15.0193 2.52186 14.9732 2.77086 L 14.9439 2.89488 C 14.9403 2.90782 14.9372 2.92116 14.9331 2.93395 L 13.0132 8.95348 L 12.9966 9.00035 L 19.9995 9.00035 C 20.377 8.99962 20.7472 9.10533 21.0669 9.30602 C 21.3874 9.50722 21.6438 9.79572 21.8072 10.1371 C 21.9705 10.4784 22.0342 10.8589 21.9898 11.2347 C 21.9509 11.5635 21.8311 11.8768 21.6421 12.1468 L 21.5562 12.2601 L 21.4976 12.3265 L 11.5972 22.5267 L 11.5962 22.5257 C 11.3775 22.7596 11.0908 22.9195 10.7749 22.9779 C 10.4404 23.0398 10.0945 22.986 9.79446 22.8255 C 9.49446 22.6651 9.25781 22.4067 9.12356 22.0941 C 8.98947 21.7816 8.96599 21.4328 9.05618 21.1048 L 9.06692 21.0658 L 10.9868 15.0463 L 11.0034 15.0004 L 3.99954 15.0004 L 3.99954 14.9994 C 3.62242 14.9999 3.25259 14.8942 2.93313 14.6937 C 2.61282 14.4926 2.35623 14.2048 2.1929 13.8636 C 2.02953 13.5222 1.96587 13.1409 2.01028 12.765 C 2.05474 12.3893 2.2055 12.0334 2.44388 11.7396 L 2.50247 11.6732 L 12.4029 1.47399 C 12.6216 1.23994 12.9092 1.08127 13.2251 1.02281 L 13.3511 1.00426 Z M 4.00247 13.0004 L 10.9995 13.0004 C 11.3221 12.9998 11.6401 13.0771 11.9263 13.2259 C 12.2132 13.3752 12.4602 13.5914 12.645 13.8568 C 12.8299 14.1223 12.9474 14.4294 12.9878 14.7504 C 13.0261 15.055 12.9904 15.363 12.8902 15.6527 L 12.8931 15.6537 L 11.6265 19.6244 L 19.9976 11.0004 L 12.9995 11.0004 L 12.9995 10.9994 C 12.6774 10.9998 12.3596 10.9234 12.0738 10.7748 C 11.7868 10.6255 11.5399 10.4084 11.355 10.1429 C 11.1703 9.87756 11.0527 9.57115 11.0122 9.25035 C 10.9738 8.94533 11.0084 8.63614 11.1089 8.34606 L 11.107 8.34606 L 12.3726 4.37438 L 4.00247 13.0004 Z" strokeLinecap="round" />
                        </g>
                      </g>
                    </g>
                  </svg>
                      4x Asked
                    </div>
                  </div>
                  <h3 className="text-xl font-bold leading-tight tracking-tight">
                    Critically evaluate the Information Processing Theory of memory.
                  </h3>
                </div>
                <div className="border-t border-[#dee1e6] p-6">
                  <p className="mb-4 text-sm font-bold text-[#565d6d]">AI Answer Structure:</p>
                  <ul className="space-y-3 text-sm text-[#565d6d]">
                    <li className="flex gap-2">
                      <span className="font-bold">•</span>
                      <span>Introduction to Information Processing (Atkinson & Shiffrin).</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold">•</span>
                      <span>The three stages: Sensory, Short-term, Long-term memory.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold">•</span>
                      <span>Strengths: Clear framework, testable hypotheses.</span>
                    </li>
                    <li className="flex gap-2 opacity-40">
                      <span className="font-bold">•</span>
                      <div className="flex-1 space-y-2">
                        <p>Weaknesses: Oversimplifies complex cognitive processes...</p>
                        <div className="h-2 w-3/4 rounded-full bg-[#f3f4f6]"></div>
                        <div className="h-2 w-1/2 rounded-full bg-[#f3f4f6]"></div>
                      </div>
                    </li>
                  </ul>
                </div>
                <div className="absolute bottom-0 left-0 h-24 w-full bg-gradient-to-t from-white to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-y border-[#dee1e6] bg-[#fafafb]/50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">Work smarter, not harder.</h2>
            <p className="mx-auto max-w-2xl text-lg text-[#565d6d]">
              Everything you need to optimize your study sessions and maximize your exam performance in one unified platform.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-[#dee1e6]">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#01696F]/10">
                <svg data-svg-id="SVG_6" className="h-6 w-6 text-[#01696F]" viewBox="0 0 24 24">
                <g transform="matrix(1 0 0 1 0 0)">
                  <g style={{  }}>
                    <g transform="matrix(1 0 0 1 12 12)">
                      <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(31,158,249)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 2 19 L 2 3 C 2 2.44772 2.44772 2 3 2 C 3.55228 2 4 2.44772 4 3 L 4 19 C 4 19.2652 4.10543 19.5195 4.29297 19.707 C 4.48051 19.8946 4.73478 20 5 20 L 21 20 C 21.5523 20 22 20.4477 22 21 C 22 21.5523 21.5523 22 21 22 L 5 22 C 4.20435 22 3.44152 21.6837 2.87891 21.1211 C 2.3163 20.5585 2 19.7956 2 19 Z" strokeLinecap="round" />
                    </g>
                    <g transform="matrix(1 0 0 1 18 13)">
                      <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(31,158,249)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-18, -13)" d="M 17 17 L 17 9 C 17 8.44772 17.4477 8 18 8 C 18.5523 8 19 8.44772 19 9 L 19 17 C 19 17.5523 18.5523 18 18 18 C 17.4477 18 17 17.5523 17 17 Z" strokeLinecap="round" />
                    </g>
                    <g transform="matrix(1 0 0 1 13 11)">
                      <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(31,158,249)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-13, -11)" d="M 12 17 L 12 5 C 12 4.44772 12.4477 4 13 4 C 13.5523 4 14 4.44772 14 5 L 14 17 C 14 17.5523 13.5523 18 13 18 C 12.4477 18 12 17.5523 12 17 Z" strokeLinecap="round" />
                    </g>
                    <g transform="matrix(1 0 0 1 8 15.5)">
                      <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(31,158,249)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-8, -15.5)" d="M 7 17 L 7 14 C 7 13.4477 7.44772 13 8 13 C 8.55228 13 9 13.4477 9 14 L 9 17 C 9 17.5523 8.55228 18 8 18 C 7.44772 18 7 17.5523 7 17 Z" strokeLinecap="round" />
                    </g>
                  </g>
                </g>
              </svg>
              </div>
              <h3 className="mb-4 text-xl font-bold">Frequency Heatmap</h3>
              <p className="text-[#565d6d]">
                Instantly see which topics and specific questions appear most frequently in past IGNOU MAPC exams. Focus your energy where it matters.
              </p>
            </div>
            {/* Feature 2 */}
            <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-[#dee1e6]">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#01696F]/10">
                <svg data-svg-id="SVG_7" className="h-6 w-6 text-[#01696F]" viewBox="0 0 24 24">
                <g transform="matrix(1 0 0 1 0 0)">
                  <g style={{  }}>
                    <g transform="matrix(1 0 0 1 12 12)">
                      <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(31,158,249)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 12.1226 1.00463 C 12.3659 1.0245 12.6004 1.10396 12.8062 1.2351 L 12.9068 1.30444 L 13.0015 1.38256 C 13.1833 1.5454 13.3221 1.75038 13.4068 1.97924 L 13.4449 2.09545 L 13.4507 2.11498 L 15.0318 8.25072 L 15.0308 8.25072 C 15.0755 8.42361 15.1663 8.58149 15.2925 8.70776 C 15.4188 8.83398 15.5767 8.92385 15.7496 8.9685 L 21.8843 10.5496 L 21.9009 10.5544 C 22.1778 10.6308 22.4258 10.7846 22.6168 10.9968 L 22.6959 11.0915 L 22.7662 11.1921 C 22.9198 11.4325 23.0025 11.7127 23.0025 11.9997 C 23.0025 12.328 22.8947 12.6477 22.6959 12.9089 C 22.5219 13.1374 22.2862 13.3107 22.0181 13.4089 L 21.9009 13.446 C 21.8955 13.4475 21.8898 13.4485 21.8843 13.4499 L 15.7496 15.031 C 15.5766 15.0756 15.4189 15.1664 15.2925 15.2927 C 15.1664 15.4189 15.0755 15.5761 15.0308 15.7488 L 15.0318 15.7497 L 13.4498 21.8845 L 13.4439 21.904 C 13.3557 22.2193 13.1666 22.4972 12.9058 22.6951 C 12.645 22.8929 12.3269 23.0007 11.9996 23.0007 C 11.6723 23.0007 11.3541 22.8928 11.0933 22.6951 C 10.8652 22.522 10.6912 22.2882 10.5923 22.0212 L 10.5552 21.904 C 10.5534 21.8975 10.5511 21.8911 10.5494 21.8845 L 8.96832 15.7497 C 8.92369 15.5768 8.83383 15.419 8.70758 15.2927 C 8.61271 15.1979 8.50001 15.1231 8.37653 15.073 L 8.25055 15.031 L 2.11578 13.449 L 2.09235 13.4431 C 1.77835 13.354 1.50203 13.1644 1.30524 12.904 C 1.13303 12.6762 1.02947 12.4048 1.00641 12.1218 L 1.00153 11.9997 L 1.00641 11.8777 C 1.02955 11.5948 1.13313 11.3232 1.30524 11.0955 L 1.38239 11.0017 C 1.57142 10.7898 1.81755 10.6354 2.09235 10.5574 L 2.11481 10.5505 L 8.25055 8.96752 L 8.37653 8.92553 C 8.49992 8.87546 8.61275 8.80154 8.70758 8.70678 C 8.83366 8.58078 8.92351 8.42323 8.96832 8.25072 L 10.5504 2.11498 L 10.5562 2.09545 C 10.6444 1.78025 10.8335 1.50226 11.0943 1.30444 L 11.1939 1.2351 C 11.4342 1.08187 11.7139 0.999748 12.0005 0.999748 L 12.1226 1.00463 Z M 10.9048 8.74975 L 10.9048 8.75072 C 10.7707 9.26938 10.5006 9.74313 10.1216 10.1218 C 9.78998 10.4532 9.3854 10.7009 8.94196 10.8474 L 8.74957 10.904 L 4.50348 11.9988 L 8.74957 13.0945 L 8.94196 13.1511 C 9.3857 13.2978 9.78987 13.5469 10.1216 13.8787 C 10.5005 14.2576 10.7709 14.7309 10.9048 15.2497 L 10.9058 15.2507 L 11.9986 19.4958 L 13.0943 15.2507 L 13.0943 15.2497 L 13.1509 15.0574 C 13.2976 14.6139 13.5469 14.2103 13.8785 13.8787 C 14.2576 13.4996 14.7314 13.2284 15.2505 13.0945 L 19.4976 11.9997 L 15.2505 10.905 C 14.7315 10.7711 14.2575 10.5008 13.8785 10.1218 C 13.5467 9.79007 13.2976 9.38583 13.1509 8.94213 L 13.0943 8.74975 L 11.9996 4.50268 L 10.9048 8.74975 Z" strokeLinecap="round" />
                    </g>
                    <g transform="matrix(1 0 0 1 20 5)">
                      <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(31,158,249)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-20, -5)" d="M 19 7 L 19 3 C 19 2.44772 19.4477 2 20 2 C 20.5523 2 21 2.44772 21 3 L 21 7 C 21 7.55228 20.5523 8 20 8 C 19.4477 8 19 7.55228 19 7 Z" strokeLinecap="round" />
                    </g>
                    <g transform="matrix(1 0 0 1 20 5)">
                      <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(31,158,249)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-20, -5)" d="M 22 4 C 22.5523 4 23 4.44772 23 5 C 23 5.55228 22.5523 6 22 6 L 18 6 C 17.4477 6 17 5.55228 17 5 C 17 4.44772 17.4477 4 18 4 L 22 4 Z" strokeLinecap="round" />
                    </g>
                    <g transform="matrix(1 0 0 1 4 18)">
                      <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(31,158,249)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-4, -18)" d="M 3 19 L 3 17 C 3 16.4477 3.44772 16 4 16 C 4.55228 16 5 16.4477 5 17 L 5 19 C 5 19.5523 4.55228 20 4 20 C 3.44772 20 3 19.5523 3 19 Z" strokeLinecap="round" />
                    </g>
                    <g transform="matrix(1 0 0 1 4 18)">
                      <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(31,158,249)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-4, -18)" d="M 5 17 C 5.55228 17 6 17.4477 6 18 C 6 18.5523 5.55228 19 5 19 L 3 19 C 2.44772 19 2 18.5523 2 18 C 2 17.4477 2.44772 17 3 17 L 5 17 Z" strokeLinecap="round" />
                    </g>
                  </g>
                </g>
              </svg>
              </div>
              <h3 className="mb-4 text-xl font-bold">AI-Generated Answers</h3>
              <p className="text-[#565d6d]">
                Stop searching through thick blocks of text. Get concise, structured, and exam-ready answers generated by AI, tailored to IGNOU's marking scheme.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-[#dee1e6]">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#01696F]/10">
                <svg data-svg-id="SVG_8" className="h-6 w-6 text-[#01696F]" viewBox="0 0 24 24">
                <g transform="matrix(1 0 0 1 0 0)">
                  <g style={{  }}>
                    <g transform="matrix(1 0 0 1 7 11.99)">
                      <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(31,158,249)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-7, -11.99)" d="M 8.9162 0.992079 C 9.44938 0.980966 9.98009 1.07661 10.4758 1.27333 C 10.9714 1.47005 11.4225 1.76394 11.8029 2.13759 C 12.1833 2.51123 12.4851 2.95713 12.6906 3.44911 C 12.8958 3.94027 13.0014 4.46762 13.0002 4.99989 L 13.0002 18.0009 C 12.9995 18.6843 12.8583 19.3603 12.5861 19.9872 C 12.3139 20.614 11.916 21.1783 11.4172 21.6454 C 10.9183 22.1124 10.3291 22.4726 9.68573 22.703 C 9.0423 22.9334 8.35797 23.0295 7.67597 22.9852 C 6.99406 22.941 6.3281 22.7577 5.71991 22.4462 C 5.11177 22.1346 4.57414 21.7012 4.13983 21.1737 C 3.70547 20.6461 3.38346 20.0346 3.19452 19.3778 C 3.06539 18.9289 3.00156 18.465 3.00116 17.9999 C 2.52503 17.6431 2.11443 17.2037 1.7912 16.7001 C 1.35122 16.0145 1.0853 15.2316 1.01679 14.4198 C 0.948327 13.6082 1.07984 12.7924 1.39862 12.0429 C 1.61534 11.5334 1.9155 11.0661 2.28339 10.6571 C 2.11909 10.1899 2.02335 9.69981 2.00312 9.20204 C 1.97233 8.44406 2.11492 7.68897 2.41913 6.99403 C 2.72337 6.29908 3.18116 5.68189 3.75897 5.19032 C 4.14557 4.86144 4.57965 4.59571 5.04413 4.39833 C 5.08463 4.12808 5.15303 3.86198 5.24823 3.60438 C 5.43309 3.10425 5.71579 2.64592 6.08026 2.25673 C 6.44482 1.86749 6.88422 1.55499 7.37128 1.33778 C 7.85808 1.12075 8.38333 1.00325 8.9162 0.992079 Z M 8.95819 2.9911 C 8.69168 2.99668 8.42919 3.05637 8.18573 3.16493 C 7.9422 3.27353 7.7225 3.4293 7.54022 3.62392 C 7.35798 3.81851 7.21664 4.04767 7.12421 4.29774 C 7.03181 4.54775 6.9903 4.81371 7.00214 5.07997 C 7.02324 5.55254 6.71027 5.97582 6.25214 6.09364 C 5.81129 6.20699 5.40158 6.41881 5.05487 6.71376 C 4.70826 7.00866 4.43369 7.3789 4.25116 7.79579 C 4.06862 8.21277 3.98269 8.66617 4.00116 9.12099 C 4.01967 9.57566 4.14192 10.0201 4.35761 10.4208 C 4.58512 10.8434 4.48006 11.3681 4.10761 11.6708 C 3.72828 11.979 3.42978 12.3754 3.23847 12.8251 C 3.04715 13.2749 2.96885 13.7648 3.00995 14.2518 C 3.05106 14.7389 3.21081 15.2087 3.4748 15.62 C 3.73877 16.0312 4.09904 16.372 4.5246 16.6122 C 4.87912 16.8123 5.07679 17.2075 5.0246 17.6112 C 4.97206 18.0179 5.00402 18.431 5.11737 18.8251 C 5.23073 19.2191 5.42324 19.5857 5.68378 19.9022 C 5.94439 20.2188 6.26708 20.4789 6.63202 20.6659 C 6.99698 20.8529 7.39665 20.9626 7.80585 20.9891 C 8.21489 21.0157 8.62501 20.9583 9.01093 20.8202 C 9.39696 20.682 9.75066 20.4657 10.05 20.1854 C 10.3493 19.9052 10.5888 19.5664 10.7521 19.1903 C 10.9152 18.8146 10.9996 18.4094 11.0002 17.9999 L 11.0002 4.99696 L 10.9904 4.79774 C 10.9712 4.59961 10.9229 4.40498 10.8459 4.2206 C 10.7431 3.97457 10.5918 3.75119 10.4016 3.56435 C 10.2113 3.37749 9.98533 3.23009 9.73749 3.13173 C 9.48976 3.03348 9.22464 2.98555 8.95819 2.9911 Z" strokeLinecap="round" />
                    </g>
                    <g transform="matrix(1 0 0 1 10.5 11)">
                      <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(31,158,249)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-10.5, -11)" d="M 12.0547 8.002 C 12.6061 8.03221 13.0282 8.50336 12.9981 9.05473 C 12.9388 10.1408 12.5589 11.1846 11.9063 12.0547 C 11.2537 12.9249 10.3581 13.5824 9.33209 13.9434 C 8.81115 14.1267 8.24003 13.853 8.0567 13.3321 C 7.87344 12.8111 8.14714 12.24 8.66802 12.0567 C 9.32089 11.827 9.89139 11.4091 10.3067 10.8555 C 10.722 10.3017 10.9643 9.63655 11.002 8.94536 C 11.0322 8.39402 11.5034 7.97194 12.0547 8.002 Z" strokeLinecap="round" />
                    </g>
                    <g transform="matrix(1 0 0 1 6.2 5.81)">
                      <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(31,158,249)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-6.2, -5.81)" d="M 5.96204 4.12597 C 6.47946 4.10482 6.92164 4.48054 6.99329 4.98242 L 7.00208 5.08398 L 7.02649 5.32421 C 7.05232 5.48269 7.09743 5.63739 7.16028 5.78515 L 7.2677 6.00097 L 7.31458 6.09179 C 7.52186 6.55418 7.3489 7.10767 6.90051 7.36621 C 6.45179 7.62471 5.88601 7.49649 5.58997 7.08496 L 5.5343 6.99902 L 5.42004 6.78613 C 5.20494 6.35435 5.06944 5.88714 5.02063 5.40722 L 5.00403 5.16601 L 5.005 5.06347 C 5.03558 4.55761 5.44479 4.14721 5.96204 4.12597 Z" strokeLinecap="round" />
                    </g>
                    <g transform="matrix(1 0 0 1 3.77 10.7)">
                      <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(31,158,249)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-3.77, -10.7)" d="M 3.57661 9.62598 C 4.05944 9.35803 4.66792 9.53193 4.93599 10.0147 C 5.20395 10.4975 5.03007 11.106 4.54732 11.374 C 4.39276 11.4598 4.24592 11.5593 4.10884 11.6709 L 4.02583 11.7324 C 3.60254 12.0109 3.0285 11.9287 2.70161 11.5273 C 2.35305 11.0993 2.41736 10.4699 2.84517 10.1211 L 3.01997 9.98438 C 3.19721 9.85263 3.38338 9.73323 3.57661 9.62598 Z" strokeLinecap="round" />
                    </g>
                    <g transform="matrix(1 0 0 1 5.02 17.74)">
                      <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(31,158,249)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-5.02, -17.74)" d="M 3.16187 16.9928 C 3.41618 16.5419 3.96808 16.3641 4.43238 16.567 L 4.52418 16.6129 L 4.69605 16.7028 C 5.10189 16.8983 5.54763 16.9999 5.99976 16.9996 C 6.55193 16.9995 6.99951 17.4474 6.99976 17.9996 C 6.99997 18.5518 6.55285 18.9992 6.00074 18.9996 C 5.24714 19 4.50432 18.8304 3.82789 18.5045 L 3.54176 18.3551 L 3.45484 18.3004 C 3.04094 18.0081 2.90761 17.4437 3.16187 16.9928 Z" strokeLinecap="round" />
                    </g>
                    <g transform="matrix(1 0 0 1 14 13)">
                      <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(31,158,249)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-14, -13)" d="M 16 12 C 16.5523 12 17 12.4477 17 13 C 17 13.5523 16.5523 14 16 14 L 12 14 C 11.4477 14 11 13.5523 11 13 C 11 12.4477 11.4477 12 12 12 L 16 12 Z" strokeLinecap="round" />
                    </g>
                    <g transform="matrix(1 0 0 1 16 19.5)">
                      <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(31,158,249)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-16, -19.5)" d="M 19 21 L 19 20 C 19 19.7348 18.8946 19.4805 18.707 19.293 C 18.5195 19.1054 18.2652 19 18 19 L 12 19 C 11.4477 19 11 18.5523 11 18 C 11 17.4477 11.4477 17 12 17 L 18 17 C 18.7957 17 19.5585 17.3163 20.1211 17.8789 C 20.6837 18.4415 21 19.2043 21 20 L 21 21 C 21 21.5523 20.5523 22 20 22 C 19.4477 22 19 21.5523 19 21 Z" strokeLinecap="round" />
                    </g>
                    <g transform="matrix(1 0 0 1 16 8)">
                      <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(31,158,249)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-16, -8)" d="M 20 7 C 20.5523 7 21 7.44772 21 8 C 21 8.55228 20.5523 9 20 9 L 12 9 C 11.4477 9 11 8.55228 11 8 C 11 7.44772 11.4477 7 12 7 L 20 7 Z" strokeLinecap="round" />
                    </g>
                    <g transform="matrix(1 0 0 1 17 5.5)">
                      <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(31,158,249)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-17, -5.5)" d="M 15 8 L 15 5 C 15 4.20435 15.3163 3.44152 15.8789 2.87891 C 16.4415 2.3163 17.2044 2 18 2 C 18.5523 2 19 2.44772 19 3 C 19 3.55228 18.5523 4 18 4 C 17.7348 4 17.4805 4.10543 17.293 4.29297 C 17.1054 4.48051 17 4.73478 17 5 L 17 8 C 17 8.55228 16.5523 9 16 9 C 15.4477 9 15 8.55228 15 8 Z" strokeLinecap="round" />
                    </g>
                    <g transform="matrix(1 0 0 1 16 13)">
                      <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(31,158,249)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-16, -13)" d="M 16 12.5 C 15.7239 12.5 15.5 12.7239 15.5 13 C 15.5 13.2761 15.7239 13.5 16 13.5 C 16.2761 13.5 16.5 13.2761 16.5 13 C 16.5 12.7239 16.2761 12.5 16 12.5 Z M 17.5 13 C 17.5 13.8284 16.8284 14.5 16 14.5 C 15.1716 14.5 14.5 13.8284 14.5 13 C 14.5 12.1716 15.1716 11.5 16 11.5 C 16.8284 11.5 17.5 12.1716 17.5 13 Z" strokeLinecap="round" />
                    </g>
                    <g transform="matrix(1 0 0 1 18 3)">
                      <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(31,158,249)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-18, -3)" d="M 18 2.5 C 17.7239 2.5 17.5 2.72386 17.5 3 C 17.5 3.27614 17.7239 3.5 18 3.5 C 18.2761 3.5 18.5 3.27614 18.5 3 C 18.5 2.72386 18.2761 2.5 18 2.5 Z M 19.5 3 C 19.5 3.82843 18.8284 4.5 18 4.5 C 17.1716 4.5 16.5 3.82843 16.5 3 C 16.5 2.17157 17.1716 1.5 18 1.5 C 18.8284 1.5 19.5 2.17157 19.5 3 Z" strokeLinecap="round" />
                    </g>
                    <g transform="matrix(1 0 0 1 20 21)">
                      <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(31,158,249)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-20, -21)" d="M 20 20.5 C 19.7239 20.5 19.5 20.7239 19.5 21 C 19.5 21.2761 19.7239 21.5 20 21.5 C 20.2761 21.5 20.5 21.2761 20.5 21 C 20.5 20.7239 20.2761 20.5 20 20.5 Z M 21.5 21 C 21.5 21.8284 20.8284 22.5 20 22.5 C 19.1716 22.5 18.5 21.8284 18.5 21 C 18.5 20.1716 19.1716 19.5 20 19.5 C 20.8284 19.5 21.5 20.1716 21.5 21 Z" strokeLinecap="round" />
                    </g>
                    <g transform="matrix(1 0 0 1 20 8)">
                      <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(31,158,249)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-20, -8)" d="M 20 7.5 C 19.7239 7.5 19.5 7.72386 19.5 8 C 19.5 8.27614 19.7239 8.5 20 8.5 C 20.2761 8.5 20.5 8.27614 20.5 8 C 20.5 7.72386 20.2761 7.5 20 7.5 Z M 21.5 8 C 21.5 8.82843 20.8284 9.5 20 9.5 C 19.1716 9.5 18.5 8.82843 18.5 8 C 18.5 7.17157 19.1716 6.5 20 6.5 C 20.8284 6.5 21.5 7.17157 21.5 8 Z" strokeLinecap="round" />
                    </g>
                  </g>
                </g>
              </svg>
              </div>
              <h3 className="mb-4 text-xl font-bold">Psychological Concept Tree</h3>
              <p className="text-[#565d6d]">
                Understand the connections between domains, sub-domains, and key theories. Build a solid conceptual foundation rather than just rote memorizing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Preview Section */}
      <section className="relative overflow-hidden py-24 lg:py-32">
        <div className="absolute top-0 left-1/2 h-[500px] w-[1024px] -translate-x-1/2 rounded-full bg-[#01696F]/5 blur-[100px]"></div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <div className="mb-4 inline-flex items-center rounded-full border border-[#dee1e6] px-3 py-1">
              <span className="text-xs font-bold text-[#171a1f]">Live Preview</span>
            </div>
            <h2 className="mb-6 text-4xl font-bold tracking-tight">Experience the AI Advantage</h2>
            <p className="mx-auto max-w-3xl text-lg text-[#565d6d]">
              See exactly how Topper101 breaks down complex psychological concepts into easily digestible, exam-ready answers.
            </p>
          </div>

          <div className="mx-auto max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-[#dee1e6]">
            <div className="bg-[#f3f4f6]/20 p-8">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full border border-[#dee1e6] bg-white px-3 py-0.5 text-xs font-medium">MPC-003</div>
                  <span className="text-xs text-[#565d6d]">•</span>
                  <span className="text-xs font-medium text-[#565d6d]">Dec 2023, June 2022, Dec 2020</span>
                </div>
                <div className="rounded-full bg-[#01696F]/10 px-3 py-0.5 text-xs font-bold text-[#01696F]">3x Asked</div>
              </div>
              <h3 className="text-2xl font-bold leading-tight tracking-tight">
                Discuss the role of nature vs. nurture in personality development with suitable examples.
              </h3>
            </div>
            <div className="relative p-8">
              <div className="space-y-8">
                <div>
                  <h4 className="mb-3 text-lg font-bold">1. Introduction</h4>
                  <p className="leading-relaxed text-[#171a1f]/90">
                    The nature vs. nurture debate is one of the oldest philosophical issues within psychology. It explores the relative contributions of genetic inheritance (nature) and environmental factors (nurture) to human development and personality.
                  </p>
                </div>
                <div>
                  <h4 className="mb-3 text-lg font-bold">2. The Role of Nature (Genetics)</h4>
                  <p className="mb-4 leading-relaxed text-[#171a1f]/90">
                    Nature refers to all of the genes and hereditary factors that influence who we are—from our physical appearance to our personality characteristics.
                  </p>
                  <ul className="space-y-4 text-[#565d6d]">
                    <li className="flex gap-3">
                      <span className="font-bold">•</span>
                      <p><span className="font-bold">Twin Studies:</span> Research on identical twins separated at birth often shows striking similarities in personality...</p>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold">•</span>
                      <p><span className="font-bold">Temperament:</span> Innate traits observed in infancy (e.g., activity level, emotional reactivity) often persist...</p>
                    </li>
                  </ul>
                </div>
                <div className="opacity-50">
                  <h4 className="mb-3 text-lg font-bold">3. The Role of Nurture (Environment)</h4>
                  <p className="leading-relaxed text-[#171a1f]/90">
                    Nurture refers to all the environmental variables that impact who we are, including our early childhood experiences, how we were raised, our social relationships, and our surrounding culture.
                  </p>
                </div>
              </div>

              {/* Lock Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-white via-white/95 to-transparent pt-20 backdrop-blur-[4px]">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-[#dee1e6]">
                  <svg data-svg-id="SVG_9" className="h-6 w-6 text-[#565d6d]" viewBox="0 0 24 24">
                    <g transform="matrix(1 0 0 1 0 0)">
                      <g style={{  }}>
                        <g transform="matrix(1 0 0 1 12 16.5)">
                          <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -16.5)" d="M 20 13 C 20 12.4477 19.5523 12 19 12 L 5 12 C 4.44772 12 4 12.4477 4 13 L 4 20 C 4 20.5523 4.44772 21 5 21 L 19 21 C 19.5523 21 20 20.5523 20 20 L 20 13 Z M 22 20 C 22 21.6569 20.6569 23 19 23 L 5 23 C 3.34315 23 2 21.6569 2 20 L 2 13 C 2 11.3431 3.34315 10 5 10 L 19 10 C 20.6569 10 22 11.3431 22 13 L 22 20 Z" strokeLinecap="round" />
                        </g>
                        <g transform="matrix(1 0 0 1 12 6.5)">
                          <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -6.5)" d="M 16 11 L 16 7 C 16 5.93913 15.5783 4.92202 14.8281 4.17188 C 14.078 3.42173 13.0609 3 12 3 C 10.9391 3 9.92202 3.42173 9.17188 4.17188 C 8.42173 4.92202 8 5.93913 8 7 L 8 11 C 8 11.5523 7.55228 12 7 12 C 6.44772 12 6 11.5523 6 11 L 6 7 C 6 5.4087 6.63259 3.88303 7.75781 2.75781 C 8.88303 1.63259 10.4087 1 12 1 C 13.5913 1 15.117 1.63259 16.2422 2.75781 C 17.3674 3.88303 18 5.4087 18 7 L 18 11 C 18 11.5523 17.5523 12 17 12 C 16.4477 12 16 11.5523 16 11 Z" strokeLinecap="round" />
                        </g>
                      </g>
                    </g>
                  </svg>
                </div>
                <h4 className="mb-2 text-xl font-bold">Unlock the full AI-structured answer</h4>
                <p className="mb-8 max-w-md text-center text-[#565d6d]">
                  Get instant access to this complete answer, plus 500+ more high-probability questions across all MAPC subjects.
                </p>
                <button className="rounded-full bg-[#01696F] px-10 py-4 text-base font-semibold text-white shadow-xl transition-all hover:scale-[1.02] hover:bg-[#01696F]/90">
                  Unlock full answer — ₹299/month
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="border-y border-[#dee1e6] bg-[#fafafb] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-20 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight">How it works</h2>
            <p className="text-lg text-[#565d6d]">Three simple steps to streamline your exam preparation.</p>
          </div>
          <div className="relative">
            {/* Connecting Line */}
            <div className="absolute top-12 left-0 hidden h-px w-full bg-[#dee1e6] md:block"></div>
            <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
              <div className="relative flex flex-col items-center text-center">
                <div className="z-10 mb-8 flex h-24 w-24 items-center justify-center rounded-full border-[4px] border-[#fafafb] bg-white text-3xl font-extrabold text-[#01696F] shadow-lg">
                  01
                </div>
                <h3 className="mb-4 text-xl font-bold">Personalize your path</h3>
                <p className="text-[#565d6d]">Tell us your stream (Clinical, Counseling, etc.), year, and target exam date.</p>
              </div>
              <div className="relative flex flex-col items-center text-center">
                <div className="z-10 mb-8 flex h-24 w-24 items-center justify-center rounded-full border-[4px] border-[#fafafb] bg-white text-3xl font-extrabold text-[#01696F] shadow-lg">
                  02
                </div>
                <h3 className="mb-4 text-xl font-bold">Focus on what matters</h3>
                <p className="text-[#565d6d]">Our AI scans past papers to highlight the most frequently asked questions.</p>
              </div>
              <div className="relative flex flex-col items-center text-center">
                <div className="z-10 mb-8 flex h-24 w-24 items-center justify-center rounded-full border-[4px] border-[#fafafb] bg-white text-3xl font-extrabold text-[#01696F] shadow-lg">
                  03
                </div>
                <h3 className="mb-4 text-xl font-bold">Master the concepts</h3>
                <p className="text-[#565d6d]">Review concise, structured AI answers and visualize connections in the Concept Tree.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-20 text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight">Simple, transparent pricing</h2>
            <p className="mx-auto max-w-2xl text-lg text-[#565d6d]">
              Choose the plan that fits your study timeline. Upgrade, downgrade, or cancel anytime.
            </p>
          </div>
          <div className="grid grid-cols-1 items-end gap-8 md:grid-cols-3">
            {/* Free Tier */}
            <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-[#dee1e6]">
              <h3 className="mb-4 text-xl font-bold text-[#565d6d]">Free Tier</h3>
              <div className="mb-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">₹0</span>
                <span className="text-xl font-medium text-[#565d6d]">/mo</span>
              </div>
              <p className="mb-8 text-sm text-[#565d6d]">Perfect for getting started.</p>
              <ul className="mb-10 space-y-4">
                <li className="flex items-center gap-3 text-sm">
                  <svg data-svg-id="SVG_14" className="h-5 w-5 text-[#565d6d]" viewBox="0 0 20 20">
            <g transform="matrix(1 0 0 1 0 0)">
              <g style={{  }}>
                <g transform="matrix(0.83 0 0 0.83 10 10)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 21 12 C 21 7.02944 16.9706 3 12 3 C 7.02944 3 3 7.02944 3 12 C 3 16.9706 7.02944 21 12 21 C 16.9706 21 21 16.9706 21 12 Z M 23 12 C 23 18.0751 18.0751 23 12 23 C 5.92487 23 1 18.0751 1 12 C 1 5.92487 5.92487 1 12 1 C 18.0751 1 23 5.92487 23 12 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(0.83 0 0 0.83 10 10)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 14.3692 9.22462 C 14.7619 8.90427 15.3409 8.92686 15.707 9.29298 C 16.0732 9.65909 16.0958 10.2381 15.7754 10.6309 L 15.707 10.707 L 11.707 14.707 C 11.3409 15.0732 10.7619 15.0958 10.3692 14.7754 L 10.293 14.707 L 8.29298 12.707 L 8.22462 12.6309 C 7.90427 12.2381 7.92686 11.6591 8.29298 11.293 C 8.65909 10.9269 9.2381 10.9043 9.63087 11.2246 L 9.70704 11.293 L 11 12.5859 L 14.293 9.29298 L 14.3692 9.22462 Z" strokeLinecap="round" />
                </g>
              </g>
            </g>
          </svg>
                  <span>Access to Frequency Heatmap</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <svg data-svg-id="SVG_15" className="h-5 w-5 text-[#565d6d]" viewBox="0 0 20 20">
            <g transform="matrix(1 0 0 1 0 0)">
              <g style={{  }}>
                <g transform="matrix(0.83 0 0 0.83 10 10)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 21 12 C 21 7.02944 16.9706 3 12 3 C 7.02944 3 3 7.02944 3 12 C 3 16.9706 7.02944 21 12 21 C 16.9706 21 21 16.9706 21 12 Z M 23 12 C 23 18.0751 18.0751 23 12 23 C 5.92487 23 1 18.0751 1 12 C 1 5.92487 5.92487 1 12 1 C 18.0751 1 23 5.92487 23 12 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(0.83 0 0 0.83 10 10)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 14.3692 9.22462 C 14.7619 8.90427 15.3409 8.92686 15.707 9.29298 C 16.0732 9.65909 16.0958 10.2381 15.7754 10.6309 L 15.707 10.707 L 11.707 14.707 C 11.3409 15.0732 10.7619 15.0958 10.3692 14.7754 L 10.293 14.707 L 8.29298 12.707 L 8.22462 12.6309 C 7.90427 12.2381 7.92686 11.6591 8.29298 11.293 C 8.65909 10.9269 9.2381 10.9043 9.63087 11.2246 L 9.70704 11.293 L 11 12.5859 L 14.293 9.29298 L 14.3692 9.22462 Z" strokeLinecap="round" />
                </g>
              </g>
            </g>
          </svg>
                  <span>View top 5 questions per subject</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <svg data-svg-id="SVG_16" className="h-5 w-5 text-[#565d6d]" viewBox="0 0 20 20">
            <g transform="matrix(1 0 0 1 0 0)">
              <g style={{  }}>
                <g transform="matrix(0.83 0 0 0.83 10 10)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 21 12 C 21 7.02944 16.9706 3 12 3 C 7.02944 3 3 7.02944 3 12 C 3 16.9706 7.02944 21 12 21 C 16.9706 21 21 16.9706 21 12 Z M 23 12 C 23 18.0751 18.0751 23 12 23 C 5.92487 23 1 18.0751 1 12 C 1 5.92487 5.92487 1 12 1 C 18.0751 1 23 5.92487 23 12 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(0.83 0 0 0.83 10 10)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 14.3692 9.22462 C 14.7619 8.90427 15.3409 8.92686 15.707 9.29298 C 16.0732 9.65909 16.0958 10.2381 15.7754 10.6309 L 15.707 10.707 L 11.707 14.707 C 11.3409 15.0732 10.7619 15.0958 10.3692 14.7754 L 10.293 14.707 L 8.29298 12.707 L 8.22462 12.6309 C 7.90427 12.2381 7.92686 11.6591 8.29298 11.293 C 8.65909 10.9269 9.2381 10.9043 9.63087 11.2246 L 9.70704 11.293 L 11 12.5859 L 14.293 9.29298 L 14.3692 9.22462 Z" strokeLinecap="round" />
                </g>
              </g>
            </g>
          </svg>
                  <span>Basic Concept Tree view</span>
                </li>
              </ul>
              <button className="w-full rounded-md border border-[#dee1e6] py-3 text-sm font-bold transition-all hover:bg-gray-50">
                Get Started Free
              </button>
            </div>

            {/* Exam Pass (Featured) */}
            <div className="relative rounded-xl bg-white p-8 shadow-2xl ring-2 ring-[#01696F]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#01696F] px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-md">
                Most Popular
              </div>
              <h3 className="mb-4 text-xl font-bold text-[#01696F]">Exam Pass</h3>
              <div className="mb-4 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold">₹299</span>
                <span className="text-xl font-medium text-[#565d6d]">/mo</span>
              </div>
              <p className="mb-8 text-sm text-[#565d6d]">Ideal for the final 3-month sprint.</p>
              <ul className="mb-10 space-y-4">
                <li className="flex items-center gap-3 text-sm font-bold">
                  <svg data-svg-id="SVG_10" className="h-5 w-5 text-[#01696F]" viewBox="0 0 21 21">
            <g transform="matrix(1 0 0 1 0 0)">
              <g style={{  }}>
                <g transform="matrix(0.88 0 0 0.88 10.5 10.5)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(31,158,249)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 21 12 C 21 7.02944 16.9706 3 12 3 C 7.02944 3 3 7.02944 3 12 C 3 16.9706 7.02944 21 12 21 C 16.9706 21 21 16.9706 21 12 Z M 23 12 C 23 18.0751 18.0751 23 12 23 C 5.92487 23 1 18.0751 1 12 C 1 5.92487 5.92487 1 12 1 C 18.0751 1 23 5.92487 23 12 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(0.88 0 0 0.88 10.5 10.5)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(31,158,249)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 14.3692 9.22462 C 14.7619 8.90427 15.3409 8.92686 15.707 9.29298 C 16.0732 9.65909 16.0958 10.2381 15.7754 10.6309 L 15.707 10.707 L 11.707 14.707 C 11.3409 15.0732 10.7619 15.0958 10.3692 14.7754 L 10.293 14.707 L 8.29298 12.707 L 8.22462 12.6309 C 7.90427 12.2381 7.92686 11.6591 8.29298 11.293 C 8.65909 10.9269 9.2381 10.9043 9.63087 11.2246 L 9.70704 11.293 L 11 12.5859 L 14.293 9.29298 L 14.3692 9.22462 Z" strokeLinecap="round" />
                </g>
              </g>
            </g>
          </svg>
                  <span>Everything in Free, plus:</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <svg data-svg-id="SVG_11" className="h-5 w-5 text-[#01696F]" viewBox="0 0 21 21">
            <g transform="matrix(1 0 0 1 0 0)">
              <g style={{  }}>
                <g transform="matrix(0.88 0 0 0.88 10.5 10.5)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(31,158,249)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 21 12 C 21 7.02944 16.9706 3 12 3 C 7.02944 3 3 7.02944 3 12 C 3 16.9706 7.02944 21 12 21 C 16.9706 21 21 16.9706 21 12 Z M 23 12 C 23 18.0751 18.0751 23 12 23 C 5.92487 23 1 18.0751 1 12 C 1 5.92487 5.92487 1 12 1 C 18.0751 1 23 5.92487 23 12 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(0.88 0 0 0.88 10.5 10.5)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(31,158,249)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 14.3692 9.22462 C 14.7619 8.90427 15.3409 8.92686 15.707 9.29298 C 16.0732 9.65909 16.0958 10.2381 15.7754 10.6309 L 15.707 10.707 L 11.707 14.707 C 11.3409 15.0732 10.7619 15.0958 10.3692 14.7754 L 10.293 14.707 L 8.29298 12.707 L 8.22462 12.6309 C 7.90427 12.2381 7.92686 11.6591 8.29298 11.293 C 8.65909 10.9269 9.2381 10.9043 9.63087 11.2246 L 9.70704 11.293 L 11 12.5859 L 14.293 9.29298 L 14.3692 9.22462 Z" strokeLinecap="round" />
                </g>
              </g>
            </g>
          </svg>
                  <span><span className="font-bold">Unlimited access</span> to all AI Answers</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <svg data-svg-id="SVG_12" className="h-5 w-5 text-[#01696F]" viewBox="0 0 21 21">
            <g transform="matrix(1 0 0 1 0 0)">
              <g style={{  }}>
                <g transform="matrix(0.88 0 0 0.88 10.5 10.5)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(31,158,249)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 21 12 C 21 7.02944 16.9706 3 12 3 C 7.02944 3 3 7.02944 3 12 C 3 16.9706 7.02944 21 12 21 C 16.9706 21 21 16.9706 21 12 Z M 23 12 C 23 18.0751 18.0751 23 12 23 C 5.92487 23 1 18.0751 1 12 C 1 5.92487 5.92487 1 12 1 C 18.0751 1 23 5.92487 23 12 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(0.88 0 0 0.88 10.5 10.5)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(31,158,249)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 14.3692 9.22462 C 14.7619 8.90427 15.3409 8.92686 15.707 9.29298 C 16.0732 9.65909 16.0958 10.2381 15.7754 10.6309 L 15.707 10.707 L 11.707 14.707 C 11.3409 15.0732 10.7619 15.0958 10.3692 14.7754 L 10.293 14.707 L 8.29298 12.707 L 8.22462 12.6309 C 7.90427 12.2381 7.92686 11.6591 8.29298 11.293 C 8.65909 10.9269 9.2381 10.9043 9.63087 11.2246 L 9.70704 11.293 L 11 12.5859 L 14.293 9.29298 L 14.3692 9.22462 Z" strokeLinecap="round" />
                </g>
              </g>
            </g>
          </svg>
                  <span>Personalized Study Planner</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <svg data-svg-id="SVG_13" className="h-5 w-5 text-[#01696F]" viewBox="0 0 21 21">
            <g transform="matrix(1 0 0 1 0 0)">
              <g style={{  }}>
                <g transform="matrix(0.88 0 0 0.88 10.5 10.5)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(31,158,249)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 21 12 C 21 7.02944 16.9706 3 12 3 C 7.02944 3 3 7.02944 3 12 C 3 16.9706 7.02944 21 12 21 C 16.9706 21 21 16.9706 21 12 Z M 23 12 C 23 18.0751 18.0751 23 12 23 C 5.92487 23 1 18.0751 1 12 C 1 5.92487 5.92487 1 12 1 C 18.0751 1 23 5.92487 23 12 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(0.88 0 0 0.88 10.5 10.5)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(31,158,249)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 14.3692 9.22462 C 14.7619 8.90427 15.3409 8.92686 15.707 9.29298 C 16.0732 9.65909 16.0958 10.2381 15.7754 10.6309 L 15.707 10.707 L 11.707 14.707 C 11.3409 15.0732 10.7619 15.0958 10.3692 14.7754 L 10.293 14.707 L 8.29298 12.707 L 8.22462 12.6309 C 7.90427 12.2381 7.92686 11.6591 8.29298 11.293 C 8.65909 10.9269 9.2381 10.9043 9.63087 11.2246 L 9.70704 11.293 L 11 12.5859 L 14.293 9.29298 L 14.3692 9.22462 Z" strokeLinecap="round" />
                </g>
              </g>
            </g>
          </svg>
                  <span>'Last 24 Hours' revision mode</span>
                </li>
              </ul>
              <button className="w-full rounded-md bg-[#01696F] py-4 text-base font-bold text-white shadow-lg transition-all hover:bg-[#01696F]/90">
                Subscribe Monthly
              </button>
            </div>

            {/* Full Archive */}
            <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-[#dee1e6]">
              <h3 className="mb-4 text-xl font-bold text-[#565d6d]">Full Archive</h3>
              <div className="mb-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">₹1999</span>
                <span className="text-xl font-medium text-[#565d6d]">/yr</span>
              </div>
              <p className="mb-8 text-sm text-[#565d6d]">For first-year students planning ahead.</p>
              <ul className="mb-10 space-y-4">
                <li className="flex items-center gap-3 text-sm font-bold">
                  <svg data-svg-id="SVG_17" className="h-5 w-5 text-[#565d6d]" viewBox="0 0 20 20">
            <g transform="matrix(1 0 0 1 0 0)">
              <g style={{  }}>
                <g transform="matrix(0.83 0 0 0.83 10 10)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 21 12 C 21 7.02944 16.9706 3 12 3 C 7.02944 3 3 7.02944 3 12 C 3 16.9706 7.02944 21 12 21 C 16.9706 21 21 16.9706 21 12 Z M 23 12 C 23 18.0751 18.0751 23 12 23 C 5.92487 23 1 18.0751 1 12 C 1 5.92487 5.92487 1 12 1 C 18.0751 1 23 5.92487 23 12 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(0.83 0 0 0.83 10 10)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 14.3692 9.22462 C 14.7619 8.90427 15.3409 8.92686 15.707 9.29298 C 16.0732 9.65909 16.0958 10.2381 15.7754 10.6309 L 15.707 10.707 L 11.707 14.707 C 11.3409 15.0732 10.7619 15.0958 10.3692 14.7754 L 10.293 14.707 L 8.29298 12.707 L 8.22462 12.6309 C 7.90427 12.2381 7.92686 11.6591 8.29298 11.293 C 8.65909 10.9269 9.2381 10.9043 9.63087 11.2246 L 9.70704 11.293 L 11 12.5859 L 14.293 9.29298 L 14.3692 9.22462 Z" strokeLinecap="round" />
                </g>
              </g>
            </g>
          </svg>
                  <span>All Exam Pass features</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <svg data-svg-id="SVG_18" className="h-5 w-5 text-[#565d6d]" viewBox="0 0 20 20">
            <g transform="matrix(1 0 0 1 0 0)">
              <g style={{  }}>
                <g transform="matrix(0.83 0 0 0.83 10 10)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 21 12 C 21 7.02944 16.9706 3 12 3 C 7.02944 3 3 7.02944 3 12 C 3 16.9706 7.02944 21 12 21 C 16.9706 21 21 16.9706 21 12 Z M 23 12 C 23 18.0751 18.0751 23 12 23 C 5.92487 23 1 18.0751 1 12 C 1 5.92487 5.92487 1 12 1 C 18.0751 1 23 5.92487 23 12 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(0.83 0 0 0.83 10 10)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 14.3692 9.22462 C 14.7619 8.90427 15.3409 8.92686 15.707 9.29298 C 16.0732 9.65909 16.0958 10.2381 15.7754 10.6309 L 15.707 10.707 L 11.707 14.707 C 11.3409 15.0732 10.7619 15.0958 10.3692 14.7754 L 10.293 14.707 L 8.29298 12.707 L 8.22462 12.6309 C 7.90427 12.2381 7.92686 11.6591 8.29298 11.293 C 8.65909 10.9269 9.2381 10.9043 9.63087 11.2246 L 9.70704 11.293 L 11 12.5859 L 14.293 9.29298 L 14.3692 9.22462 Z" strokeLinecap="round" />
                </g>
              </g>
            </g>
          </svg>
                  <span>Full year access (save 40%)</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <svg data-svg-id="SVG_19" className="h-5 w-5 text-[#565d6d]" viewBox="0 0 20 20">
            <g transform="matrix(1 0 0 1 0 0)">
              <g style={{  }}>
                <g transform="matrix(0.83 0 0 0.83 10 10)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 21 12 C 21 7.02944 16.9706 3 12 3 C 7.02944 3 3 7.02944 3 12 C 3 16.9706 7.02944 21 12 21 C 16.9706 21 21 16.9706 21 12 Z M 23 12 C 23 18.0751 18.0751 23 12 23 C 5.92487 23 1 18.0751 1 12 C 1 5.92487 5.92487 1 12 1 C 18.0751 1 23 5.92487 23 12 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(0.83 0 0 0.83 10 10)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(86,93,109)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -12)" d="M 14.3692 9.22462 C 14.7619 8.90427 15.3409 8.92686 15.707 9.29298 C 16.0732 9.65909 16.0958 10.2381 15.7754 10.6309 L 15.707 10.707 L 11.707 14.707 C 11.3409 15.0732 10.7619 15.0958 10.3692 14.7754 L 10.293 14.707 L 8.29298 12.707 L 8.22462 12.6309 C 7.90427 12.2381 7.92686 11.6591 8.29298 11.293 C 8.65909 10.9269 9.2381 10.9043 9.63087 11.2246 L 9.70704 11.293 L 11 12.5859 L 14.293 9.29298 L 14.3692 9.22462 Z" strokeLinecap="round" />
                </g>
              </g>
            </g>
          </svg>
                  <span>Downloadable PDF notes</span>
                </li>
              </ul>
              <button className="w-full rounded-md border border-[#dee1e6] py-3 text-sm font-bold transition-all hover:bg-gray-50">
                Get Annual Pass
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#dee1e6] bg-[#f3f4f6]/20 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-[#565d6d]">
                <svg data-svg-id="SVG_20" className="h-4 w-4 text-white" viewBox="0 0 16 16">
            <g transform="matrix(1 0 0 1 0 0)">
              <g style={{  }}>
                <g transform="matrix(0.67 0 0 0.67 8.01 6.67)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(255,255,255)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12.01, -10)" d="M 12.0002 3.99963 C 12.4297 3.99966 12.8545 4.09189 13.2453 4.27014 L 13.2443 4.27112 L 21.8156 8.17346 L 21.8147 8.17444 C 22.1632 8.32627 22.4622 8.57366 22.675 8.88928 C 22.8936 9.21358 23.0117 9.59491 23.0158 9.98596 C 23.0199 10.3772 22.9094 10.7615 22.6975 11.0905 C 22.4873 11.4166 22.1863 11.6734 21.8322 11.8317 L 21.8332 11.8326 L 13.2434 15.7311 C 12.9018 15.8866 12.5342 15.9757 12.1604 15.9957 L 12.0002 16.0006 C 11.6244 16.0006 11.2524 15.9296 10.9035 15.7926 L 10.7551 15.7301 L 2.18477 11.8219 L 2.18477 11.8209 C 1.83498 11.6644 1.53717 11.4114 1.32735 11.0905 C 1.11465 10.7651 1.00117 10.3844 1.00117 9.99573 C 1.00123 9.60717 1.11476 9.22723 1.32735 8.90198 C 1.53745 8.58058 1.8353 8.32601 2.18575 8.16956 L 10.7551 4.27112 L 10.7551 4.27014 C 11.1459 4.09189 11.5706 3.99963 12.0002 3.99963 Z M 3.01485 10.0026 L 11.5852 13.9098 L 11.6848 13.9489 C 11.7863 13.9826 11.8928 14.0006 12.0002 14.0006 L 12.1066 13.9948 C 12.2131 13.9833 12.3174 13.9544 12.4152 13.9098 L 12.4172 13.9098 L 21.007 10.0114 L 21.0168 10.0074 C 21.0068 10.0033 20.9964 9.99828 20.9865 9.99377 L 12.4152 6.09045 L 12.4152 6.08948 C 12.285 6.03008 12.1433 5.99966 12.0002 5.99963 C 11.8929 5.99963 11.7862 6.01673 11.6848 6.05042 L 11.5852 6.08948 L 11.5842 6.09045 L 3.01387 9.98987 L 3.00117 9.99573 L 3.01485 10.0026 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(0.67 0 0 0.67 14.67 8.67)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(255,255,255)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-22, -13)" d="M 21 16 L 21 10 C 21 9.44772 21.4477 9 22 9 C 22.5523 9 23 9.44772 23 10 L 23 16 C 23 16.5523 22.5523 17 22 17 C 21.4477 17 21 16.5523 21 16 Z" strokeLinecap="round" />
                </g>
                <g transform="matrix(0.67 0 0 0.67 8 10.5)">
                  <path style={{ stroke: "none", strokeWidth: "1", strokeDasharray: "none", strokeLinecap: "butt", strokeDashoffset: "0", strokeLinejoin: "miter", strokeMiterlimit: "4", fill: "rgb(255,255,255)", fillRule: "nonzero", opacity: "1" }} transform=" translate(-12, -15.75)" d="M 5 16 L 5 12.5 C 5 11.9477 5.44772 11.5 6 11.5 C 6.55228 11.5 7 11.9477 7 12.5 L 7 16 L 7.01074 16.0967 C 7.06328 16.3502 7.32825 16.7885 8.2041 17.2266 C 9.15862 17.7038 10.5239 18 12 18 L 12.5479 17.9863 C 13.8109 17.9232 14.9607 17.6442 15.7959 17.2266 C 16.7968 16.726 17 16.225 17 16 L 17 12.5 C 17 11.9477 17.4477 11.5 18 11.5 C 18.5523 11.5 19 11.9477 19 12.5 L 19 16 C 19 17.3662 17.9386 18.3911 16.6895 19.0156 C 15.4745 19.623 13.9156 19.9568 12.3193 19.9961 L 12 20 C 10.2936 20 8.60643 19.6635 7.31055 19.0156 C 6.13943 18.4301 5.13377 17.4927 5.0127 16.252 L 5 16 Z" strokeLinecap="round" />
                </g>
              </g>
            </g>
          </svg>
              </div>
              <span className="text-base font-bold text-[#565d6d]">Topper101</span>
            </div>
            <p className="text-sm text-[#565d6d]">© 2026 Topper101. All rights reserved.</p>
            <div className="flex items-center gap-8 text-sm text-[#565d6d]">
              <a href="#" className="hover:text-[#01696F]">Privacy Policy</a>
              <a href="#" className="hover:text-[#01696F]">Terms of Service</a>
              <a href="#" className="hover:text-[#01696F]">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}