
export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-40">
      <div className="max-w-4xl mx-auto bg-gradient-to-br from-[#071035]/60 via-[#0b1238]/50 to-black/40 rounded-2xl p-8 backdrop-blur-md border border-white/6 shadow-xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Terms of Use for CyreneAI Launchpad</h1>
            <p className="text-sm text-white/70 mt-1">Last Updated: September 15, 2025</p>
          </div>
        </div>

        <section className="mt-6 space-y-6 text-white text-base leading-relaxed">
          <p>
            These Terms of Use (the &quot;Terms&quot;) constitute a legally binding agreement between you (&quot;you,&quot; &quot;your,&quot; or &quot;User&quot;) and CyreneAI LLC (&quot;CyreneAI,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
            These Terms govern your access to and use of the CyreneAI Launchpad platform (the &quot;Platform&quot;). By using the Platform, you agree to these Terms and our <a href="/privacy" className="text-[#4D84EE]">Privacy Policy</a>.
          </p>

          <div className="p-4 bg-white/3 rounded-lg border border-white/6">
            <h3 className="text-lg font-semibold">Important Notices</h3>
            <ul className="list-disc pl-5 mt-2 space-y-2 text-white/85">
              <li><strong>High Risk & No Financial Advice:</strong> Tokens and crypto are speculative. We are not financial advisors. Consult professionals before transacting.</li>
              <li><strong>No Custody:</strong> We do not hold tokens or private keys. Use third-party wallets for transactions.</li>
              <li><strong>Utility Tokens Only:</strong> The Platform is intended for utility tokens; we make no claims about token legality or value.</li>
              <li><strong>Decentralized & Permissionless:</strong> The Platform is permissionless; user content may not be moderated and is your responsibility.</li>
              <li><strong>NSFW & Sensitive Content:</strong> You may encounter sensitive content; proceed at your own risk.</li>
            </ul>
          </div>

          <h2 className="text-2xl font-semibold mt-2">1. Eligibility</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Be at least 18 years old (or the age of majority in your jurisdiction).</li>
            <li>Not be a restricted person or entity under applicable laws or sanctions.</li>
            <li>Have legal capacity to enter into these Terms.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-4">2. Description of Services</h2>
          <p>
            CyreneAI is a launchpad platform enabling creators to submit and launch utility tokens on supported blockchains. The Platform uses smart contracts for launches; all interactions occur on public blockchains and are outside our control.
          </p>

          <h2 className="text-2xl font-semibold mt-4">3. Accounts and Security</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Create accounts with accurate information and secure your credentials and private keys.</li>
            <li>Prohibited actions include creating multiple accounts, using bots, wash trading, and uploading harmful content.</li>
            <li>KYC may be required for certain users or projects.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-4">4. Fees and Payments</h2>
          <p>Platform fees may apply (listing, launch, or percentage fees). Blockchain fees (gas) are your responsibility. All fees are non-refundable unless required by law.</p>

          <h2 className="text-2xl font-semibold mt-4">5. User Content and Projects</h2>
          <p>
            By submitting projects or content, you grant CyreneAI a license to use it for Platform purposes. Project Teams are responsible for token development and compliance; CyreneAI does not endorse or guarantee projects.
          </p>

          <h2 className="text-2xl font-semibold mt-4">6. Prohibited Conduct and Content</h2>
          <p>Prohibited activities include promoting violence, engaging in illegal activities, harassment, IP infringement, and distributing malware. Violations may result in account suspension and sharing with law enforcement if required.</p>

          <h2 className="text-2xl font-semibold mt-4">7. Risks and Disclaimers</h2>
          <p>
            Using the Platform carries risks: market volatility, smart contract vulnerabilities, regulatory changes, and third-party failures. The Platform is provided &quot;as is&quot; without warranties. You accept all risks and bear responsibility for outcomes.
          </p>

          <h2 className="text-2xl font-semibold mt-4">8. Limitation of Liability</h2>
          <p>To the fullest extent permitted by law, CyreneAI and affiliates are not liable for indirect or consequential damages. Total liability is capped to fees paid by you in the prior 12 months.</p>

          <h2 className="text-2xl font-semibold mt-4">9. Indemnification</h2>
          <p>You agree to indemnify and hold CyreneAI harmless from claims arising from your use of the Platform or violation of these Terms.</p>

          <h2 className="text-2xl font-semibold mt-4">10. Intellectual Property</h2>
          <p>The Platform, code, and trademarks are owned by CyreneAI or licensors. You are granted a limited license for personal use only.</p>

          <h2 className="text-2xl font-semibold mt-4">11. Termination</h2>
          <p>CyreneAI may suspend or terminate access for any reason. Your obligations (e.g., indemnity) survive termination.</p>

          <h2 className="text-2xl font-semibold mt-4">12. Governing Law and Dispute Resolution</h2>
          <p>These Terms are governed by the laws of the Republic of the Marshall Islands. Disputes shall be resolved in Majuro courts or binding arbitration under Marshall Islands rules.</p>

          <h2 className="text-2xl font-semibold mt-4">13. Miscellaneous</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Entire Agreement: These Terms are the complete agreement between you and CyreneAI.</li>
            <li>Severability: Invalid provisions do not affect the remainder.</li>
            <li>Changes: We may update these Terms; continued use constitutes acceptance.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-4">Contact</h2>
          <p>For questions, email <a href="mailto:support@cyreneai.com" className="text-[#4D84EE]">support@cyreneai.com</a> or write to our address in Majuro.</p>

          <div className="mt-6 p-4 bg-white/2 rounded-lg border border-white/6">
            <p className="text-sm text-white/80">By using the CyreneAI Platform, you acknowledge that you have read, understood, and agree to these Terms.</p>
          </div>
        </section>
      </div>
    </div>
  );
}