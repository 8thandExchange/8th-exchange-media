import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { CampaignHero } from "@/components/home/CampaignHero";
import { FeatureTrio } from "@/components/home/FeatureTrio";
import { RightMoment } from "@/components/home/RightMoment";
import { CreativeShowcase } from "@/components/home/CreativeShowcase";
import { ChannelsGrid } from "@/components/home/ChannelsGrid";
import { CampaignCalendar } from "@/components/home/CampaignCalendar";
import { MissionControl } from "@/components/home/MissionControl";
import { PlatformBand } from "@/components/home/PlatformBand";
import { UpdatesSection } from "@/components/home/UpdatesSection";
import { TestimonialSection } from "@/components/home/TestimonialSection";
import { ResourcesSection } from "@/components/home/ResourcesSection";
import { SupportTrio } from "@/components/home/SupportTrio";
import { GrowCta } from "@/components/home/GrowCta";
import { ContactSection } from "@/components/home/ContactSection";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero — create better campaigns */}
        <CampaignHero />

        {/* Three reasons to work with us */}
        <FeatureTrio />

        {/* Automation — the right message at the right moment */}
        <RightMoment />

        {/* Creative that lets your brand shine */}
        <CreativeShowcase />

        {/* Reach people across channels */}
        <ChannelsGrid />

        {/* See it all come together — one campaign calendar */}
        <CampaignCalendar />

        {/* Mission control — audience, content, automation, insights */}
        <MissionControl />

        {/* One partner, your whole stack */}
        <PlatformBand />

        {/* Agency updates */}
        <UpdatesSection />

        {/* Client voice */}
        <TestimonialSection />

        {/* Guidance & resources */}
        <ResourcesSection />

        {/* Partnership promises */}
        <SupportTrio />

        {/* Ready to grow */}
        <GrowCta />

        {/* Start the conversation */}
        <ContactSection />
      </main>
      <SiteFooter />
    </>
  );
}
