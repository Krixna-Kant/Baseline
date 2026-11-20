import { featurePage } from "@/components/FeaturePage";
import { ReferralPacket } from "@/components/packet/ReferralPacket";

const page = featurePage((d) => d.packet.title, ReferralPacket);
export const generateMetadata = page.generateMetadata;
export default page.Page;
