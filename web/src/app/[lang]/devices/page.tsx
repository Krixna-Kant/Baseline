import { featurePage } from "@/components/FeaturePage";
import { DeviceHub } from "@/components/devices/DeviceHub";

const page = featurePage((d) => d.devices.title, DeviceHub);
export const generateMetadata = page.generateMetadata;
export default page.Page;
