import { getCalendarItems } from "../../../../lib/events/public";
import { SHOW_SAMPLE_EVENTS } from "../../../../lib/site-config";
import RoomsView from "./RoomsView";

/** /members/rooms — each room: what's on now, the rest of today, check in, book it. */
export default function MembersRoomsPage() {
  return <RoomsView items={getCalendarItems()} showSamples={SHOW_SAMPLE_EVENTS} />;
}
