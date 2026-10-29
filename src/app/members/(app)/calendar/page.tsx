import { getCalendarItems } from "../../../../lib/events/public";
import { SHOW_SAMPLE_EVENTS } from "../../../../lib/site-config";
import CalendarView from "./CalendarView";

/** /members/calendar — every night ahead, members-only nights included, with RSVPs. */
export default function MembersCalendarPage() {
  return <CalendarView items={getCalendarItems()} showSamples={SHOW_SAMPLE_EVENTS} />;
}
