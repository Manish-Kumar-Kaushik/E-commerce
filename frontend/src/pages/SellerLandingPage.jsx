import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import Seo from "../components/Seo";
import ContactUsForm from "../components/ContactUsForm";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const SELLER_BANNER_IMAGE = "/seller_banner.png";
const SELLER_STATS = [
  { value: "14 Lakh+", label: "Seller community" },
  { value: "24×7", label: "Online Business" },
  { value: "7", label: "days* payment" },
  { value: "19000+", label: "Pincodes served" },
];

const WHY_SELLERS_FEATURES = [
  {
    title: "Opportunity",
    description:
      "45 crore+ of customers across 19000+ pincodes, and access to shopping festivals like The Big Billion Days, and more.",
    iconClass: "ri-binoculars-line",
  },
  {
    title: "Ease of Doing Business",
    description:
      "Create your SHOPZY seller account in under 10 minutes with just 1 product and a valid GSTIN number.",
    iconClass: "ri-magic-line",
  },
  {
    title: "Growth",
    description:
      "Sellers see an average 2.8X spike in growth, 2.3X more visibility, and up to 5X growth in big sale events.",
    iconClass: "ri-bar-chart-grouped-line",
  },
  {
    title: "Additional Support",
    description:
      "Account management services, exclusive training programs, business insights, catalogue and photoshoot support, and more.",
    iconClass: "ri-customer-service-2-line",
  },
];

const SELLER_SUCCESS_STORIES = [
  {
    name: "Geetank Bajaj",
    business: "MGM Garments",
    initials: "GB",
    quote:
      "At 23, I joined our family business, registered on SHOPZY during the pandemic, became a Gold Seller, and achieved a 3 Crores turnover with Seller Support's guidance. Growing every day!",
  },
  {
    name: "Ankita Sharma",
    business: "Urban Stitches",
    initials: "AS",
    quote:
      "From a small local setup to pan-India orders, SHOPZY helped us scale faster with better visibility and a strong logistics network.",
  },
  {
    name: "Rohit Mehta",
    business: "HomeNest Decor",
    initials: "RM",
    quote:
      "With easy onboarding and great campaign support, we expanded our catalog and doubled our monthly sales in less than a year.",
  },
  {
    name: "Sana Khan",
    business: "Glow Essentials",
    initials: "SK",
    quote:
      "The seller tools, insights, and account management support made it simple to grow our beauty brand and reach new customers daily.",
  },
];

const JOURNEY_STEPS = [
  {
    title: "Create",
    description: "Register in just 10 mins with valid GST, address, and bank details",
    iconClass: "ri-store-2-line",
  },
  {
    title: "List",
    description: "List your products (min 1 no.) that you want to sell on Shopsy",
    iconClass: "ri-layout-grid-line",
  },
  {
    title: "Orders",
    description: "Receive orders from over 45 crore+ Shopsy customers.",
    iconClass: "ri-shopping-bag-3-line",
  },
  {
    title: "Shipment",
    description: "Shopsy ensures stress free delivery of your products",
    iconClass: "ri-truck-line",
  },
  {
    title: "Payment",
    description: "Receive payment 7 days* from the date of dispatch of your order",
    iconClass: "ri-bank-line",
  },
];

const SELLER_ONBOARDING_STEPS = [
  {
    step: "1",
    title: "Basic info",
    description: "Add full name, unique store name, and business type.",
  },
  {
    step: "2",
    title: "Contact details",
    description: "Verify phone and email, then add pickup address and PIN code.",
  },
  {
    step: "3",
    title: "Business verification",
    description: "Submit PAN, GST, and bank details for KYC review.",
  },
  {
    step: "4",
    title: "Documents",
    description: "Upload PAN, bank proof, address proof, and optional GST certificate.",
  },
  {
    step: "5",
    title: "Store setup",
    description: "Configure logo, banner, categories, and return policy templates.",
  },
  {
    step: "6",
    title: "Admin review",
    description: "Account stays pending until approval unlocks the dashboard.",
  },
];

const GROWTH_TOOLS = [
  {
    title: "Fulfilment by Shopsy",
    description:
      "Worried about storing, packing, shipping, and delivering your products? Let Shopsy do it all for you.",
    iconClass: "ri-store-2-line",
  },
  {
    title: "Shopsy Ads",
    description:
      "Curious how your products will stand out from your competitors and gain maximum visibility?",
    iconClass: "ri-megaphone-line",
  },
  {
    title: "Shopping Festivals",
    description:
      "Get access to India’s biggest shopping festivals, The Big Billion Day, Big Diwali Sale, and more.",
    iconClass: "ri-shopping-bag-3-line",
  },
  {
    title: "Learning Center",
    description:
      "Personalised learning modules, exclusive webinars, tutorial videos, and more to help sell better faster.",
    iconClass: "ri-book-open-line",
  },
  {
    title: "Account Management",
    description:
      "Improve product selection, product pricing, business insights, & more with our expert in-house account managers.",
    iconClass: "ri-user-settings-line",
  },
  {
    title: "Mobile App",
    description:
      "Manage your online seller account 24×7 with Flipkart Seller Hub App. Compatible with all Android & iOS devices.",
    iconClass: "ri-smartphone-line",
  },
];

const SHOPSY_GATEWAY_BENEFITS = [
  {
    title: "0 Returns*",
    iconClass: "ri-arrow-left-right-line",
  },
  {
    title: "Access to budget-friendly customers",
    iconClass: "ri-group-line",
  },
  {
    title: "Lowest cost of doing business",
    iconClass: "ri-money-rupee-circle-line",
  },
];

const PLATFORM_PEEK_SLIDES = [
  {
    title: "The All New Homepage. Personalised just for you!",
    description:
      "Our new homepage is personalised for all our sellers starting from a new seller to an evolved one. Experience industry leading features.",
    image: "/Dhamaka_Selection.png",
  },
  {
    title: "Actionable insights for faster growth",
    description:
      "Get simplified data, key trends, and recommendations that help you make smarter decisions for your business.",
    image: "/Listing.png",
  },
  {
    title: "Everything at one place",
    description:
      "Orders, performance, ads, and payments — track and manage everything from one modern, easy-to-use dashboard.",
    image: "/payments_1.png",
  },
  {
    title: "Built for mobile and desktop",
    description:
      "Work seamlessly across devices and stay connected to your store 24×7 with a smooth, responsive experience.",
    image: "/Listing.png",
  },
];

const SellerLandingPage = () => {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const [platformPeekActiveIndex, setPlatformPeekActiveIndex] = useState(0);

  const navItemClass =
    "inline-flex items-center gap-1.5 px-[10px] py-0 text-[16px] font-normal leading-none text-slate-800";

  const handleStartSelling = () => {
    if (isSignedIn) {
      navigate("/vendor/register");
      return;
    }

    navigate("/account/register?redirect=%2Fvendor%2Fregister");
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Seo title="Become a Seller" description="Seller onboarding" />

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full items-center gap-10 px-8 py-5">
          <Link to="/" className="shrink-0" aria-label="SHOPZY Seller Hub">
            <div
              className="flex items-center gap-3"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#6236FF] text-xl font-extrabold text-white">
                S
              </span>
              <div className="leading-none">
                <p className="text-[20px] font-extrabold tracking-widest text-[#6236FF]">
                  SHOPSY
                </p>
                <p className="mt-1 text-[12px] font-semibold text-slate-700">
                  Seller Hub
                </p>
              </div>
            </div>
          </Link>

          <nav
            className="hidden md:flex"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            <ul className="flex items-center gap-4">
              <li>
                <a href="#" className={navItemClass}>
                  <span>Sell Online</span>
                  <i
                    aria-hidden="true"
                    className="ri-arrow-drop-down-line text-[18px] leading-none text-slate-600"
                  />
                </a>
              </li>
              <li>
                <a href="#" className={navItemClass}>
                  <span>Fees and Commission</span>
                  <i
                    aria-hidden="true"
                    className="ri-arrow-drop-down-line text-[18px] leading-none text-slate-600"
                  />
                </a>
              </li>
              <li>
                <a href="#" className={navItemClass}>
                  <span>Grow</span>
                  <i
                    aria-hidden="true"
                    className="ri-arrow-drop-down-line text-[18px] leading-none text-slate-600"
                  />
                </a>
              </li>
              <li>
                <a href="#" className={navItemClass}>
                  <span>Learn</span>
                  <i
                    aria-hidden="true"
                    className="ri-arrow-drop-down-line text-[18px] leading-none text-slate-600"
                  />
                </a>
              </li>
              <li>
                <a href="#" className={navItemClass}>
                  <span>Shopsy</span>
                  <i
                    aria-hidden="true"
                    className="ri-arrow-drop-down-line text-[18px] leading-none text-slate-600"
                  />
                </a>
              </li>
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-8">
            <button
              type="button"
              onClick={handleStartSelling}
              className="inline-flex h-14 items-center justify-center bg-[#FFCD00] px-8 py-0 text-[18px] font-normal text-[#000000] transition hover:bg-[#f3c700]"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Start Selling
            </button>
          </div>
        </div>
      </header>

      <section className="w-full bg-white px-4 pt-0 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden">
          <img
            src={SELLER_BANNER_IMAGE}
            alt="Seller banner"
            className="h-auto w-full object-cover"
            loading="eager"
            decoding="async"
          />
        </div>
      </section>
      <div
        className="mx-auto max-w-7xl overflow-hidden rounded-[22px] border border-slate-50 bg-white px-3 py-1 shadow-[0_10px_30px_rgba(15,23,42,0.10)] sm:px-4 sm:py-2"
        style={{ transform: "translate(-0.0352px, -28.4337px)" }}
      >
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
          {SELLER_STATS.map((item, index) => (
            <li
              key={item.label}
              className={`relative flex min-h-14 flex-col items-center justify-center px-6 py-1 text-center ${index < SELLER_STATS.length - 1 ? "lg:after:absolute lg:after:right-0 lg:after:top-1/2 lg:after:h-12 lg:after:w-px lg:after:-translate-y-1/2 lg:after:bg-[#cfe4f0] lg:after:content-['']" : ""}`}
            >
              <div className="flex flex-row items-center justify-center px-2 py-1">
                <div className="flex flex-col items-center">
                  <p
                    className="text-center text-[32px] font-semibold leading-9.5 text-[#027CD5]"
                    style={{ fontStyle: "normal" }}
                  >
                    {item.value}
                  </p>
                  <p
                    className="mt-1 text-center text-[14px] font-normal leading-normal text-[#333333]"
                    style={{ fontStyle: "normal" }}
                  >
                    {item.label}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <section className="px-4 pb-0 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[28px] border border-slate-200 bg-slate-50 px-6 py-8 shadow-sm sm:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6236FF]">Seller onboarding</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">Create seller login first, dashboard later.</h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Sellers first create an email and password login, then move through a guided onboarding flow for store details, KYC, bank info, and document upload. Profiles stay under review until admin approval, so the dashboard only unlocks when the account is compliant.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {SELLER_ONBOARDING_STEPS.map((item) => (
              <article key={item.step} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6236FF] text-sm font-semibold text-white">
                    {item.step}
                  </span>
                  <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleStartSelling}
              className="inline-flex items-center justify-center rounded-full bg-[#6236FF] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#4f2fe3]"
            >
              Start Selling
            </button>
          </div>
        </div>
      </section>

      <section className="px-4 pb-0 pt-6 sm:px-6 lg:px-8" style={{ padding: "40px" }}>
        <div className="mx-auto max-w-7xl" style={{ fontFamily: "Inter, sans-serif" }}>
          <div className="max-w-5xl">
            <h2
              className="text-[#2f2f2f]"
              style={{
                fontStyle: "normal",
                fontSize: "40px",
                fontWeight: 600,
                lineHeight: "48px",
                margin: "0px",
                paddingTop: "18px",
              }}
            >
              Why do <span className="text-[#1c78d0]">sellers love selling on SHOPSY?</span>
            </h2>
            <p className="mt-5 mb-8 max-w-4xl text-[16px] font-normal leading-7 text-[#717171] font-weight-300 sm:text-base">
              45 crore+ customers across India trust SHOPSY as their number one
              online shopping destination. It is no surprise that more than a
              million sellers trust SHOPSY to keep their products available
              24×7.
            </p>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-7 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
            <ul className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {WHY_SELLERS_FEATURES.map((feature) => (
                <li
                  key={feature.title}
                  className="rounded-[18px] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition-transform duration-200 hover:-translate-y-0.5"
                  style={{ minHeight: "180px" }}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#ecf6ff] text-[22px] text-[#53a8df]">
                      <i className={feature.iconClass} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[18px] font-semibold leading-6 text-[#2f2f2f]">
                        {feature.title}
                      </h3>
                    </div>
                  </div>
                  <p className="m-0 mb-1 w-full text-[14px] font-normal leading-6 text-[#5f6b7a] sm:text-[15px]">
                    {feature.description}
                  </p>
                </li>
              ))}
            </ul>

            <div className="relative hidden h-130 xl:-mt-20 xl:flex items-end justify-center self-end overflow-hidden rounded-[18px] bg-transparent">
              <img
                src="/girls 1.png"
                alt="Seller support"
                className="relative z-10 w-auto max-w-none object-contain drop-shadow-[0_10px_18px_rgba(15,23,42,0.14)]"
                style={{ height: "88%" }}
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </section>

      <section className=" bg-[#f0f5ff] px-4 py-5 sm:px-6 md:-mt-10 md:px-10 md:py-12 lg:px-10 lg:py-14">
        <div className="mx-auto flex max-w-7xl flex-col gap-16 lg:flex-row lg:gap-20 lg:items-center">
          {/* LEFT SIDE: TEXT CONTENT */}
          <div className="flex flex-col lg:w-1/2 lg:max-w-md">
            {/* HEADING */}
            <h2
              className="whitespace-nowrap text-[#333] font-semibold leading-12"
              style={{
                fontSize: "40px",
                fontWeight: 600,
                lineHeight: "48px",
                margin: "0px",
              }}
            >
              <span className="text-[#1a73e8]">Seller Success</span> Stories
            </h2>

            {/* SUBTEXT */}
            <p
              className="mt-6 max-w-sm text-gray-600"
              style={{ fontSize: "24px", fontWeight: 500 }}
            >
              14 Lakh+ sellers trust Shopsy for their online business.
            </p>

            {/* BUTTON */}
            <button
              type="button"
              className="mt-8 inline-flex max-w-max items-center justify-center rounded-md border-2 border-blue-500 bg-transparent px-6 py-2.5 text-base font-semibold text-blue-500 transition-all duration-200 hover:bg-blue-500 hover:text-white"
            >
              See All Stories
            </button>
          </div>

          {/* RIGHT SIDE: TESTIMONIAL CARD SLIDER */}
          <div className="flex flex-1 items-center justify-center lg:w-1/2 lg:justify-end">
            <div className="w-full max-w-xl lg:max-w-xl">
              <div className="relative w-full">
                <div className="w-full min-h-140 rounded-3xl bg-[#FFFFFF] px-8 py-10 text-center shadow-lg md:px-10 md:py-12">
                  {/* SWIPER CAROUSEL - only content swaps */}
                  <Swiper
                    modules={[Autoplay, Navigation, Pagination]}
                    navigation={{
                      prevEl: ".seller-swiper-prev",
                      nextEl: ".seller-swiper-next",
                    }}
                    pagination={{
                      el: ".seller-swiper-pagination",
                      clickable: true,
                    }}
                    autoplay={{
                      delay: 2500,
                      disableOnInteraction: false,
                      pauseOnMouseEnter: false,
                    }}
                    spaceBetween={0}
                    slidesPerView={1}
                    loop={true}
                    speed={700}
                    observer={true}
                    observeParents={true}
                    onSwiper={(swiper) => {
                      if (swiper?.autoplay) {
                        swiper.autoplay.start();
                      }
                    }}
                    className="h-full w-full"
                  >
                    {SELLER_SUCCESS_STORIES.map((story, index) => (
                      <SwiperSlide key={index}>
                        <div className="flex h-full flex-col items-center">
                          {/* PROFILE IMAGE */}
                          <div className="mx-auto mb-8 inline-flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#ffcc00] bg-[#ffcc00] text-2xl font-bold text-gray-800">
                            {story.initials}
                          </div>

                          {/* NAME + COMPANY */}
                          <h3
                            className="text-gray-900"
                            style={{
                              fontSize: "24px",
                              fontWeight: 500,
                              lineHeight: "30px",
                              margin: "0px 0px 9px",
                            }}
                          >
                            {story.name},
                            <br />
                            {story.business}
                          </h3>

                          {/* QUOTE ICON */}
                          <div
                            className="text-center text-6xl font-serif text-blue-200 leading-none md:text-7xl"
                            style={{
                              width: "40px",
                              height: "30px",
                              margin: "20px auto 18px",
                            }}
                          >
                            "
                          </div>

                          {/* TESTIMONIAL TEXT */}
                          <p
                            style={{
                              fontSize: "18px",
                              color: "rgb(53, 53, 53)",
                              fontWeight: 400,
                              width: "100%",
                              whiteSpace: "break-spaces",
                              textWrapStyle: "initial",
                              lineHeight: "30px",
                            }}
                          >
                            {story.quote}
                          </p>
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>

                {/* LEFT ARROW */}
                <button
                  type="button"
                  aria-label="Previous story"
                  className="seller-swiper-prev absolute left-0 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg transition-all hover:shadow-xl"
                >
                  <i className="ri-arrow-left-s-line text-2xl text-gray-600" />
                </button>

                {/* RIGHT ARROW */}
                <button
                  type="button"
                  aria-label="Next story"
                  className="seller-swiper-next absolute right-0 top-1/2 z-30 translate-x-1/2 -translate-y-1/2 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg transition-all hover:shadow-xl"
                >
                  <i className="ri-arrow-right-s-line text-2xl text-gray-600" />
                </button>
              </div>

              {/* BOTTOM PAGINATION DOTS */}
              <div className="seller-swiper-pagination mt-8 flex items-center justify-center gap-3" />
            </div>
          </div>
        </div>
      </section>
 {/*Section 4 Yourjourney on Shopsy */}
      <section className="bg-[#f3f5f7] px-4 py-14 sm:px-6 md:px-10 lg:px-10" >
        <div className="mx-auto max-w-7xl" style={{ fontFamily: "Inter, sans-serif" }}>
          <h2
            className="text-[#2f2f2f]"
            style={{
              fontStyle: "normal",
              fontSize: "40px",
              fontWeight: 600,
              lineHeight: "48px",
              margin: "0px",
              paddingTop: "18px",
            }}
          >
            <span className="text-[#1876D2]">Your Journey</span>&nbsp;on Shopsy
          </h2>

          <p className="mt-5 mb-8 max-w-4xl text-[16px] font-normal leading-7 text-[#717171] font-weight-300 sm:text-base">
            Starting your online business with Flipkart is easy. 14 lakh+ sellers trust Flipkart with their business
          </p>

          <ul className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-8">
            {JOURNEY_STEPS.map((step) => {
              const stepSvgMap = {
                Create: "/create-icon.svg",
                List: "/list-icon.svg",
                Orders: "/orders-icon.svg",
                Shipment: "/shipment-icon.svg",
                Payment: "/payment-icon.svg",
              };
              return (
              <li key={step.title} className="min-w-0">
                <div
                  className="flex items-center justify-center rounded-xl bg-[#dfe6eb]"
                  style={{
                    width: "100%",
                    height: "292px",
                    margin: "0px",
                    fontSize: "13px",
                    lineHeight: "18.57px",
                  }}
                >
                   {/*Using step-specific SVG icons from public folder*/}
                  <img
                    src={stepSvgMap[step.title]}
                    alt={`${step.title} icon`}
                    className="h-full w-full object-cover"
                    style={{ width: "100%", height: "100%", borderRadius: "10px" }}
                    loading="lazy"
                    decoding="async"
                  />
                </div>

                <h3
                  className="text-[#31353b]"
                  style={{
                    fontSize: "24px",
                    fontWeight: 500,
                    lineHeight: "30px",
                    marginTop: "16px",
                    marginBottom: "5px",
                   
                  }}
                >
                  {step.title}
                </h3>
                <p
                  className="m-0 text-[#5f6b7a]"
                  style={{
                    fontSize: "14px",
                    fontWeight: 300,
                    lineHeight: "20px",
                  }}
                >
                  {step.description}
                </p>
              </li>
            );
            })}
          </ul>

          <div className="mt-12 flex justify-center">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl border-2 border-[#1876D2] px-8 py-3 text-[34px] font-semibold text-[#1876D2] transition-colors duration-200 hover:bg-[#1876D2] hover:text-white"
            >
              Download Launch Kit
            </button>
          </div>
        </div>
      </section>

      <section className="bg-[#e9f4ff] px-4 py-14 sm:px-6 md:px-10 lg:px-10">
        <div className="mx-auto max-w-7xl" style={{ fontFamily: "Inter, sans-serif" }}>
          <h2
            className="text-[#2f2f2f]"
            style={{
              fontStyle: "normal",
              fontSize: "40px",
              fontWeight: 600,
              lineHeight: "48px",
              margin: "0px",
              paddingTop: "18px",
            }}
          >
            <span className="text-[#1876D2]">Access our tools to grow faster</span>&nbsp;on Flipkart
          </h2>

          <p className="mt-5 mb-8 max-w-4xl text-[16px] font-normal leading-7 text-[#717171] font-weight-300 sm:text-base">
            We understand that your online business may require additional support from time to time, and we've got you covered.
            With your Flipkart account, you gain access to a range of tools designed to help grow your online business.
          </p>

          <div className="relative mt-9">
            

            <ul className="relative z-10 mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {GROWTH_TOOLS.map((tool) => (
                <li
                  key={tool.title}
                  className="relative block overflow-hidden bg-white"
                  style={{
                    width: "100%",
                    minWidth: "222px",
                    height: "190px",
                    margin: "0px",
                    position: "relative",
                    borderRadius: "20px",
                    boxShadow: "rgba(208, 208, 208, 0.5) 1px 1px 16px 1px",
                    zIndex: "unset",
                    padding: "20px 22px 14px",
                  }}
                >
                  <div className="flex items-center">
                    <span
                      className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[#edf5fb] text-[#5fa7db]"
                      style={{ margin: "0px" }}
                    >
                      <i className={`${tool.iconClass} text-[28px]`} aria-hidden="true" />
                    </span>
                    <h3
                      className="font-medium"
                      style={{
                        fontSize: "18px",
                        color: "#1f2937",
                        margin: "0px 0px 0px 12px",
                      }}
                    >
                      {tool.title}
                    </h3>
                  </div>

                  <p
                    className="m-0"
                    style={{
                      fontWeight: 300,
                      fontSize: "14px",
                      color: "rgb(113, 113, 113)",
                      lineHeight: "20px",
                      height: "60px",
                      marginTop: "14px",
                      marginBottom: "10px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      overflowWrap: "break-word",
                    }}
                  >
                    {tool.description}
                  </p>

                  <button
                    type="button"
                    className="mt-auto text-[14px] font-semibold text-[#686b70] transition-colors hover:text-[#1876D2]"
                  >
                    Learn More
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-[#f3f4f6] px-4 py-14 sm:px-6 md:px-10 lg:px-10">
        <div className="mx-auto max-w-7xl" style={{ fontFamily: "Inter, sans-serif" }}>
          <div className="mb-8 flex flex-col items-center justify-center">
            <span className="text-[74px] font-extrabold leading-none text-[#4f46e5]">S</span>
            <span className="-mt-1 text-[36px] font-bold leading-none text-[#4f46e5]">shopsy</span>
            <span className="mt-1 text-[22px] font-semibold italic leading-none text-[#555]">by Flipkart</span>
          </div>

          <div
            className="overflow-hidden rounded-[42px] border border-[#b9b8ff]"
            style={{ lineHeight: "24px", padding: "32px 56px 0px" }}
          >
            <h2
              className="text-center font-medium leading-tight text-[#333]"
              style={{ fontSize: "24px", margin: "40px 0px 20px" }}
            >
              Your gateway to selling online
            </h2>

            <div className="mt-12 grid grid-cols-1 items-center gap-10 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div>
                <ul className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
                  {SHOPSY_GATEWAY_BENEFITS.map((item) => (
                    <li key={item.title} className="flex flex-col items-center text-center">
                      <span
                        className="inline-flex h-22 w-22 items-center justify-center rounded-full border-2 border-[#d5d8ea] bg-[#f7f8fc] text-[#4b4b58]"
                        style={{ margin: "0px 0px 4px" }}
                      >
                        <i className={`${item.iconClass} text-[44px]`} aria-hidden="true" />
                      </span>
                      <p
                        style={{
                          fontSize: "18px",
                          color: "#353535",
                          fontWeight: 400,
                          lineHeight: "28px",
                          margin: "0px",
                        }}
                      >
                        {item.title}
                      </p>
                    </li>
                  ))}
                </ul>

                <div className="mt-12 flex justify-center">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-xl border-2 border-[#1b84f2] px-8 py-3 text-[36px] font-semibold text-[#1b84f2] transition-colors hover:bg-[#1b84f2] hover:text-white"
                  >
                    Explore Shopsy
                  </button>
                </div>
              </div>

              <div className="relative mx-auto flex w-full max-w-90 items-end">
                <img
                  src="/girls 1.png"
                  alt="Shopsy sellers"
                  className="mx-auto block h-auto w-[65%] object-contain"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#e9f1f8] px-4 py-14 sm:px-6 md:px-10 lg:px-10">
        <div className="mx-auto max-w-7xl" style={{ fontFamily: "Inter, sans-serif" }}>
          <h2 className="text-[#2f2f2f]" style={{
              fontStyle: "normal",
              fontSize: "40px",
              fontWeight: 600,
              lineHeight: "48px",
              margin: "0px",
              paddingTop: "18px",
            }}>
            Take a sneak peek 👀 into <span className="text-[#1876D2]">our platform</span>
          </h2>

          <div className="relative mt-10">
            <button
              type="button"
              aria-label="Previous preview"
              className="platform-peek-prev absolute -left-4 top-1/2 z-20 hidden h-16 w-16 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#6b7280] shadow-md md:flex"
            >
              <i className="ri-arrow-left-s-line text-4xl" />
            </button>

            <button
              type="button"
              aria-label="Next preview"
              className="platform-peek-next absolute -right-4 top-1/2 z-20 hidden h-16 w-16 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#6b7280] shadow-md md:flex"
            >
              <i className="ri-arrow-right-s-line text-4xl" />
            </button>

            <div className="overflow-hidden rounded-[42px] bg-[#f8f8f8] px-7 py-8 md:px-10 md:py-10 lg:px-12">
              <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
                <div>
                  <Swiper
                    modules={[Autoplay, Navigation, Pagination]}
                    navigation={{
                      prevEl: ".platform-peek-prev",
                      nextEl: ".platform-peek-next",
                    }}
                    pagination={{
                      el: ".platform-peek-pagination",
                      clickable: true,
                    }}
                    autoplay={{
                      delay: 2800,
                      disableOnInteraction: false,
                    }}
                    loop={true}
                    speed={650}
                    observer={true}
                    observeParents={true}
                    onSlideChange={(swiper) => setPlatformPeekActiveIndex(swiper.realIndex)}
                    onSwiper={(swiper) => setPlatformPeekActiveIndex(swiper.realIndex)}
                    className="w-full"
                  >
                    {PLATFORM_PEEK_SLIDES.map((item, index) => (
                      <SwiperSlide key={index}>
                        <h3
                          className="max-w-xl"
                          style={{
                            textWrap: "wrap",
                            textAlign: "left",
                            marginLeft: "5px",
                            fontStyle: "normal",
                            fontSize: "24px",
                            fontWeight: 500,
                            lineHeight: "30px",
                            color: "rgb(2, 124, 213)",
                            paddingRight: "35px",
                            marginBottom: "20px",
                          }}
                        >
                          {item.title}
                        </h3>
                        <p
                          className="max-w-xl"
                          style={{
                            textWrap: "wrap",
                            textAlign: "left",
                            marginLeft: "5px",
                            fontStyle: "normal",
                            fontSize: "16px",
                            lineHeight: "24px",
                            fontWeight: 500,
                            color: "rgb(113, 113, 113)",
                            marginBottom: "25px",
                          }}
                        >
                          {item.description}
                        </p>

                        <button
                          type="button"
                          className="mt-10 inline-flex items-center justify-center rounded-xl border-2 border-[#1b84f2] px-8 py-3 text-[36px] font-semibold text-[#1b84f2] transition-colors hover:bg-[#1b84f2] hover:text-white"
                        >
                          Explore All Features
                        </button>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>

                <div className="relative mx-auto w-full max-w-3xl">
                  <img
                    src={PLATFORM_PEEK_SLIDES[platformPeekActiveIndex]?.image}
                    alt={PLATFORM_PEEK_SLIDES[platformPeekActiveIndex]?.title || "Platform preview"}
                    className="h-auto w-full object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            </div>

            <div className="platform-peek-pagination mt-6 flex items-center justify-center gap-3" />
          </div>
        </div>
      </section>

      <ContactUsForm />

      <footer className="bg-[#3f3f42] text-white" style={{ fontFamily: "Inter, sans-serif" }}>
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:px-10 lg:px-10">
          <h2 className="text-center text-[32px] font-semibold leading-9.5 text-white">
            Popular categories to sell across India
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <ul className="text-[#f2f2f2] [&>li]:py-1.25 [&>li]:text-left [&>li]:text-sm [&>li]:font-normal [&>li]:leading-[140%]">
              <li>Sell Mobile Online</li>
              <li>Sell Clothes Online</li>
              <li>Sell Sarees Online</li>
              <li>Sell Electronics Online</li>
              <li>Sell Women Clothes Online</li>
            </ul>
            <ul className="text-[#f2f2f2] [&>li]:py-1.25 [&>li]:text-left [&>li]:text-sm [&>li]:font-normal [&>li]:leading-[140%]">
              <li>Sell Shoes Online</li>
              <li>Sell Jewellery Online</li>
              <li>Sell Tshirts Online</li>
              <li>Sell Furniture Online</li>
              <li>Sell Makeup Online</li>
            </ul>
            <ul className="text-[#f2f2f2] [&>li]:py-1.25 [&>li]:text-left [&>li]:text-sm [&>li]:font-normal [&>li]:leading-[140%]">
              <li>Sell Paintings Online</li>
              <li>Sell Watch Online</li>
              <li>Sell Books Online</li>
              <li>Sell Home Products Online</li>
              <li>Sell Kurtis Online</li>
            </ul>
            <ul className="text-[#f2f2f2] [&>li]:py-1.25 [&>li]:text-left [&>li]:text-sm [&>li]:font-normal [&>li]:leading-[140%]">
              <li>Sell Beauty Products Online</li>
              <li>Sell Toys Online</li>
              <li>Sell Appliances Online</li>
              <li>Sell Shirts Online</li>
              <li>Sell Indian Clothes Online</li>
            </ul>
          </div>

          <div className="mt-8 border-t border-[#5e5e61] pt-8">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <h3 className="text-[16px] font-semibold">Sell Online</h3>
                <ul className="mt-4 text-[#e5e7eb] [&>li]:py-1.25 [&>li]:text-left [&>li]:text-sm [&>li]:font-normal [&>li]:leading-[140%]">
                  <li>Create Account</li>
                  <li>List Products</li>
                  <li>Storage &amp; Shipping</li>
                  <li>Fees &amp; Commission</li>
                  <li>Help &amp; Support</li>
                </ul>
              </div>

              <div>
                <h3 className="text-[16px] font-semibold">Grow Your Business</h3>
                <ul className="mt-4 text-[#e5e7eb] [&>li]:py-1.25 [&>li]:text-left [&>li]:text-sm [&>li]:font-normal [&>li]:leading-[140%]">
                  <li>Insights &amp; Tools</li>
                  <li>Flipkart Ads</li>
                  <li>Flipkart Value Services</li>
                  <li>Shopping Festivals</li>
                </ul>
              </div>

              <div>
                <h3 className="text-[16px] font-semibold">Learn More</h3>
                <ul className="mt-4 text-[#e5e7eb] [&>li]:py-1.25 [&>li]:text-left [&>li]:text-sm [&>li]:font-normal [&>li]:leading-[140%]">
                  <li>FAQs</li>
                  <li>Seller Success Stories</li>
                  <li>Seller Blogs</li>
                </ul>
              </div>

              <div>
                <h3 className="text-[13px] font-semibold">Download Mobile App</h3>
                <div className="mt-4 space-y-3">
                  <button
                    type="button"
                    className="inline-flex h-12 w-48 items-center justify-center rounded-md border border-[#6b6b6f] bg-black text-sm font-semibold text-white"
                  >
                    Get it on Google Play
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-12 w-48 items-center justify-center rounded-md border border-[#6b6b6f] bg-black text-sm font-semibold text-white"
                  >
                    Download on the App Store
                  </button>
                </div>

                <h4 className="mt-5 text-[13px] font-medium">Stay Connected</h4>
                <div className="mt-3 flex items-center gap-3 text-xl">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#54565a]"><i className="ri-facebook-fill" /></span>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#54565a]"><i className="ri-instagram-line" /></span>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#54565a]"><i className="ri-linkedin-fill" /></span>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#54565a]"><i className="ri-youtube-fill" /></span>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#54565a]"><i className="ri-twitter-x-line" /></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[#5e5e61] bg-[#ececec] text-[#686b70]">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-4 sm:px-6 md:flex-row md:px-10 lg:px-10">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded bg-[#6236FF] text-xl font-extrabold text-white">S</span>
              <span className="text-sm font-semibold leading-tight text-[#6236FF]">SHOPSY<br />Seller Hub</span>
            </div>
            <p className="text-sm">© 2024 Flipkart. All Rights Reserved</p>
            <p className="text-sm">Privacy Policy &nbsp;•&nbsp; Terms of Use</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full border border-[#b8d8f4] bg-white px-5 py-3 text-lg font-medium text-[#1876D2] shadow-lg"
        >
          <i className="ri-arrow-up-line" />
          Go to Top
        </button>
      </footer>
    </div>
  );
};

export default SellerLandingPage;
