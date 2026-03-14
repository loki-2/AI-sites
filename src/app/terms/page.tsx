import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Terms of Service",
    description: "Terms of Service for VibeCoders News & GetVibecoderz",
};

export default function TermsOfServicePage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 prose prose-neutral dark:prose-invert">
            <h1 className="text-4xl font-bold tracking-tight mb-8">Terms of Service</h1>
            <p className="text-muted-foreground mb-8">Last updated: March 10, 2026</p>

            <div className="space-y-8">
                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Acceptance of Terms</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        By accessing or using VibeCoders News / GetVibecoderz ("the Service"), you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the Service.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Description of Service</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        VibeCoders News is an AI-curated tech news platform for builders and a directory for freelance web and mobile talent. We provide news aggregation, user profiles, and a platform for showcasing projects and skills.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">3. User Accounts</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        When you create an account with us, you must provide accurate, complete, and current information. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service. You are responsible for safeguarding the password or authentication credentials (e.g., via Google Auth) that you use to access the Service.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">4. User Content</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"), specifically on your builder profile. You retain ownership of any intellectual property rights that you hold in that Content. In short, what belongs to you stays yours. By posting Content, you grant us a non-exclusive, royalty-free license to use, reproduce, and display such Content in connection with the Service.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Prohibited Uses</h2>
                    <p className="text-muted-foreground leading-relaxed">You agree not to use the Service:</p>
                    <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                        <li>In any way that violates any applicable national or international law or regulation.</li>
                        <li>To impersonate or attempt to impersonate VibeCoders, a VibeCoders employee, another user, or any other person or entity.</li>
                        <li>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Service, or which, as determined by us, may harm VibeCoders or users of the Service, or expose them to liability.</li>
                        <li>To post fraudulent, misleading, or inappropriate projects and content on your profile.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Termination</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">7. Limitation of Liability</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        In no event shall VibeCoders, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence) or any other legal theory.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">8. Changes to Terms</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
                    </p>
                </section>
            </div>
        </div>
    );
}
