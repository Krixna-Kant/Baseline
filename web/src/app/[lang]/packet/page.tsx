import { featurePage } from "@/components/FeaturePage";
import { ReferralPacket } from "@/components/packet/ReferralPacket";

const page = featurePage((d) => d.packet.title, ReferralPacket, "wide");
export const generateMetadata = page.generateMetadata;
export default page.Page;
