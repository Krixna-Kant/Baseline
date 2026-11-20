import { featurePage } from "@/components/FeaturePage";
import { DemoStory } from "@/components/demo/DemoStory";

const page = featurePage((d) => d.demo.title, DemoStory);
export const generateMetadata = page.generateMetadata;
export default page.Page;
