import Button from './ui/Button'

const ContactUsForm = () => {
  return (
    <section className="bg-[#f4f5f7] px-4 py-14 sm:px-6 md:px-10 lg:px-10">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
        <div className="mx-auto w-full max-w-107.5 lg:mx-0">
          <h2 className="text-[clamp(2rem,4vw,2.5rem)] font-semibold leading-tight text-[#2f2f2f] lg:whitespace-nowrap">
            We are happy to <span className="text-[#1876D2]">help you</span> 🙂
          </h2>

          <p className="mt-4 text-sm leading-7 text-[#717171] sm:text-base">
            Still have questions or queries that are left unanswered? Share your thoughts below which will help us improve your website experience.
          </p>

          <form className="mt-5 flex w-full flex-col gap-3 pt-4" onSubmit={(event) => event.preventDefault()}>
            <input
              type="text"
              placeholder="Enter Full Name *"
              className="h-11 w-full rounded-xl border border-[#b8c0cb] bg-white px-4 text-sm font-medium text-[#495a6f] outline-none transition placeholder:text-[#7a8da3] focus:border-[#1876D2] sm:h-12 sm:px-5 sm:text-base"
            />

            <input
              type="text"
              placeholder="Enter Mobile Number / Email ID *"
              className="h-11 w-full rounded-xl border border-[#b8c0cb] bg-white px-4 text-sm font-medium text-[#495a6f] outline-none transition placeholder:text-[#7a8da3] focus:border-[#1876D2] sm:h-12 sm:px-5 sm:text-base"
            />

            <select className="h-11 w-full rounded-xl border border-[#b8c0cb] bg-white px-4 text-sm font-medium text-[#4e545c] outline-none transition focus:border-[#1876D2] sm:h-12 sm:px-5 sm:text-base">
              <option value="">Select A Topic</option>
              <option value="account">Account</option>
              <option value="orders">Orders</option>
              <option value="payments">Payments</option>
              <option value="other">Other</option>
            </select>

            <textarea
              rows={5}
              placeholder="Type Your Message *"
              className="w-full resize-none rounded-xl border border-[#b8c0cb] bg-white px-4 py-2 text-sm font-medium text-[#495a6f] outline-none transition placeholder:text-[#7a8da3] focus:border-[#1876D2] sm:px-5 sm:py-3 sm:text-base"
            />

            <Button type="submit" className="w-fit self-start px-4 py-2 text-sm sm:px-5 sm:py-2">
              Send Query
            </Button>
          </form>
        </div>

        <div className="flex justify-center lg:justify-end">
          <div className="w-full max-w-xl">
            <img
              src="/Contact%20us-amico.png"
              alt="Contact us"
              className="h-auto w-full object-contain"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default ContactUsForm