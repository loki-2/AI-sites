import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy",
    description: "Privacy Policy for VibeCoders News & GetVibecoderz",
};

export default function PrivacyPolicyPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 prose prose-neutral dark:prose-invert">
            <h1 className="text-4xl font-bold tracking-tight mb-8">Privacy Policy</h1>
            <p className="text-muted-foreground mb-8">Last updated: March 10, 2026</p>

            <div className="space-y-8">
                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Introduction</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Welcome to VibeCoders News / GetVibecoderz ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website (regardless of where you visit it from) and tell you about your privacy rights and how the law protects you.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">2. The Data We Collect About You</h2>
                    <p className="text-muted-foreground leading-relaxed">We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
                    <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                        <li><strong className="text-foreground font-medium">Identity Data</strong> includes first name, last name, username or similar identifier, and profile picture (often sourced via Google Authentication).</li>
                        <li><strong className="text-foreground font-medium">Contact Data</strong> includes email address.</li>
                        <li><strong className="text-foreground font-medium">Profile Data</strong> includes your skills (e.g., frontend, backend), selected badges, projects you add (including descriptions, images, tags, and links), github/social links, and feedback or freelance application details.</li>
                        <li><strong className="text-foreground font-medium">Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, and other technology on the devices you use to access this website.</li>
                        <li><strong className="text-foreground font-medium">Usage Data</strong> includes information about how you use our website, products and services.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">3. How Is Your Personal Data Collected?</h2>
                    <p className="text-muted-foreground leading-relaxed">We use different methods to collect data from and about you including through:</p>
                    <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                        <li><strong className="text-foreground font-medium">Direct interactions.</strong> You may give us your Identity, Contact and Profile Data by filling in forms or by corresponding with us. This includes personal data you provide when you create a profile, apply for freelance opportunities, or subscribe to our news.</li>
                        <li><strong className="text-foreground font-medium">Automated technologies or interactions.</strong> As you interact with our website, we may automatically collect Technical Data about your equipment, browsing actions and patterns using tools like Google Analytics.</li>
                        <li><strong className="text-foreground font-medium">Third parties or publicly available sources.</strong> We may receive personal data about you from various third parties such as analytics providers (like Google) and authentication providers (like Supabase/Google Auth).</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">4. How We Use Your Personal Data</h2>
                    <p className="text-muted-foreground leading-relaxed">We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
                    <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                        <li>To display your public profile and projects to users and potential employers or clients on our platform.</li>
                        <li>To manage your account and authentication securely via Supabase.</li>
                        <li>To improve our website, services, marketing, customer relationships, and experiences.</li>
                        <li>To communicate with you regarding your account, updates, or freelance opportunities.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Third-Party Services</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        We use third-party services to operate our platform, including Supabase (for authentication and database), Google Analytics (for tracking website usage), Slack (for internal notifications related to articles and approvals), and Notion. These third parties have access to your Personal Information only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Data Security</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. We use secure authentication practices and do not store plain-text passwords.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">7. Your Legal Rights</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, restriction, transfer, to object to processing, to portability of data, and (where the lawful ground of processing is consent) to withdraw consent. If you wish to exercise any of these rights, please contact us.
                    </p>
                </section>
            </div>
        </div>
    );
}
