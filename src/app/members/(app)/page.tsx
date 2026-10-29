import { getCalendarItems } from "../../../lib/events/public";
import { SHOW_SAMPLE_EVENTS } from "../../../lib/site-config";
import NowView from "./NowView";

/** /members — "Now": check in, who's here, what's on. */
export default function MembersNowPage() {
  return <NowView items={getCalendarItems()} showSamples={SHOW_SAMPLE_EVENTS} />;
}
