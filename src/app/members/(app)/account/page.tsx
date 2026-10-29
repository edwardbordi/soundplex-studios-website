import ProfileForm from "../../ProfileForm";
import { Em, PageHead } from "../shared";

/** /members/account — Profile: photo, about you, where to find you, privacy, password. */
export default function MemberAccountPage() {
  return (
    <>
      <PageHead
        eyebrow="Profile"
        title={
          <>
            Your <Em>profile.</Em>
          </>
        }
        sub="Your photo, your work, and where members can find you."
      />
      <ProfileForm mode="account" />
    </>
  );
}
