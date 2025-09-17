export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-40">
      <div className="max-w-4xl mx-auto bg-gradient-to-br from-[#071035]/60 via-[#0b1238]/50 to-black/40 rounded-2xl p-8 backdrop-blur-md border border-white/6 shadow-xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Privacy Policy for CyreneAI Launchpad</h1>
            <p className="text-sm text-white/70 mt-1">Last Updated: September 15, 2025</p>
          </div>
        </div>

        <section className="mt-6 space-y-6 text-white text-base leading-relaxed">
          <p>
            This Privacy Policy ("Policy") explains how <strong>CyreneAI LLC</strong> ("CyreneAI", "we", "us", or "our"), a limited liability company
            registered in the Republic of the Marshall Islands, collects, uses, discloses, and protects your personal information when you access or use the CyreneAI
            Launchpad platform (the "Platform") and its associated services (the "Services"). This Policy is part of the Terms of Use and applies to all users of the Platform.
          </p>

          <div className="p-4 bg-white/3 rounded-lg border border-white/6">
            <h3 className="text-lg font-semibold">Important Notices</h3>
            <ul className="list-disc pl-5 mt-2 space-y-2 text-white/85">
              <li><strong>Decentralized and Permissionless:</strong> The Platform operates on public blockchains. Transaction and wallet data are public and may be linked to identities if shared.</li>
              <li><strong>No Custody of Keys:</strong> We do not store or have access to your private keys or wallets. You are responsible for securing your wallet.</li>
              <li><strong>Zero Responsibility:</strong> CyreneAI assumes no liability for data exposure resulting from blockchain activity, third-party services, or user negligence.</li>
            </ul>
          </div>

          <h2 className="text-2xl font-semibold mt-2">1. Information We Collect</h2>
          <p>We may collect the following categories of information:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Account Information:</strong> Email, username, and social handles if you provide them for optional features (e.g., XP, referrals).</li>
            <li><strong>KYC Data:</strong> Name, government-issued ID, and address when required for compliance (optional and only when requested).</li>
            <li><strong>Usage Data:</strong> IP address, browser type, device information, and activity logs to improve the Platform and detect abuse.</li>
            <li><strong>Blockchain Data:</strong> Wallet addresses and transactions are public on-chain and outside our control.</li>
            <li><strong>Referral Data:</strong> Referral codes or linked account information for tracking rewards.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-4">2. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide and maintain the Services (account management, project submissions, token launches).</li>
            <li>Administer XP rewards, referrals, and contests.</li>
            <li>Perform optional KYC checks when required for legal compliance.</li>
            <li>Detect and prevent fraud, abuse, or security incidents.</li>
            <li>Analyze usage (aggregated/anonymized) to improve the Platform.</li>
            <li>Comply with legal obligations and respond to lawful requests.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-4">3. How We Share Your Information</h2>
          <p>We may share information in limited circumstances:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>With project teams or other users as required for platform features.</li>
            <li>With law enforcement when legally compelled.</li>
            <li>With service providers (e.g., analytics, hosting) to operate the Platform.</li>
            <li>On public blockchains, where transactions are inherently public.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-4">4. Data Security</h2>
          <p>
            We use reasonable technical and organizational measures to protect data. However, due to the decentralized nature of blockchains and external services,
            we cannot guarantee absolute security. You are responsible for securing your accounts and private keys.
          </p>

          <h2 className="text-2xl font-semibold mt-4">5. Retention of Data</h2>
          <p>
            We retain personal data only as long as necessary to provide Services or comply with legal obligations. On-chain data is permanent and outside our control.
            You may request deletion of account-related data by contacting us, but we cannot guarantee full removal due to decentralization.
          </p>

          <h2 className="text-2xl font-semibold mt-4">6. Your Choices and Rights</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Opt out of providing non-essential information.</li>
            <li>Disconnect social accounts or wallets at any time.</li>
            <li>Request deletion of account data (subject to legal/technical limits).</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-4">7. International Transfers</h2>
          <p>
            Your data may be processed in jurisdictions including the Marshall Islands. By using the Platform, you consent to cross-border transfers.
          </p>

          <h2 className="text-2xl font-semibold mt-4">8. Children</h2>
          <p>The Platform is not intended for individuals under 18. We do not knowingly collect data from minors.</p>

          <h2 className="text-2xl font-semibold mt-4">9. Changes to This Policy</h2>
          <p>We may update this Policy from time to time. Continued use constitutes acceptance of any changes.</p>

          <h2 className="text-2xl font-semibold mt-4">10. Contact Us</h2>
          <p>
            For questions or requests, email <a href="mailto:support@cyreneai.com" className="text-[#4D84EE]">support@cyreneai.com</a> or write to:
            <br />
            Trust Company Complex, Ajeltake Road, Ajeltake Island, Majuro, Marshall Islands MH96960
          </p>

          <div className="mt-6 p-4 bg-white/2 rounded-lg border border-white/6">
            <p className="text-sm text-white/80">By using the CyreneAI Platform, you acknowledge that you have read, understood, and agree to this Privacy Policy.</p>
          </div>
        </section>
      </div>
    </div>
  );
}