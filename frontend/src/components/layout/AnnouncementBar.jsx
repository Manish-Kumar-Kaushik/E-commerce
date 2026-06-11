import { announcementMessages } from '../../utils/storeContent'

const AnnouncementBar = () => (
  <div className="overflow-hidden border-b border-[#f6d6cb] bg-[#fff3ee] py-2.5 text-[11px] uppercase tracking-[0.28em] text-[#9a3e28]">
    <div className="marquee-track whitespace-nowrap">
      {[...announcementMessages, ...announcementMessages].map((message, index) => (
        <span key={`${message}-${index}`} className="mx-4 inline-flex items-center gap-4">
          <span>{message}</span>
          <span className="text-[8px] text-[#ff6c4d]">●</span>
        </span>
      ))}
    </div>
  </div>
)

export default AnnouncementBar
