"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const effectiveDate = "September 20, 2025"; // keep this current when you ship updates

export default function TermsOfServicePage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12 text-slate-200">
      {/* Header */}
      <section className="mb-10">
        <Badge className="mb-4 bg-indigo-700/60 text-indigo-50">Legal</Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl bg-gradient-to-r from-indigo-300 via-purple-300 to-blue-300 bg-clip-text text-transparent">
          Terms of Service
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          Last updated: {effectiveDate}
        </p>
        <p className="mt-6 text-slate-300">
          These Terms of Service ("Terms") govern your access to and use of the
          services provided by{" "}
          <span className="font-semibold">Neda Labs Ltd</span> ("
          <strong>NedaPay</strong>", "<strong>we</strong>", "<strong>us</strong>",
          or "<strong>our</strong>") through our website at{" "}
          <Link
            href="https://nedapay.xyz"
            className="underline underline-offset-4"
          >
            nedapay.xyz
          </Link>{" "}
          and related services (collectively, the "<strong>Services</strong>").
          By accessing or using our Services, you agree to be bound by these Terms
          and our{" "}
          <Link href="/legal/privacy-policy" className="underline underline-offset-4">
            Privacy Policy
          </Link>
          .
        </p>
        <Card className="mt-6 border-slate-700/60 bg-slate-900/40">
          <CardHeader>
            <CardTitle className="text-slate-100">Quick Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-slate-300">
            <p>
              NedaPay is a comprehensive digital payment platform that enables
              stablecoin transactions, payment processing, and fiat offramping
              services. We use blockchain technology to provide secure, efficient
              payment solutions for individuals and businesses.
            </p>
            <p>
              By using our Services, you agree to comply with all applicable laws,
              maintain the security of your wallet and credentials, and use our
              platform responsibly. We reserve the right to suspend or terminate
              accounts that violate these Terms.
            </p>
          </CardContent>
        </Card>
      </section>

      <Separator className="my-8 bg-slate-700/60" />

      {/* Definitions */}
      <section id="definitions" className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-100">
          1. Definitions
        </h2>
        <p>For the purposes of these Terms of Service, the following definitions apply:</p>
        <ul className="ml-6 list-disc space-y-2 text-slate-300">
          <li>
            <span className="font-medium">Company:</span> Refers to Neda Labs Ltd,
            the entity that provides the Services described in these Terms.
          </li>
          <li>
            <span className="font-medium">Services:</span> Encompasses all products
            and services provided by NedaPay, including payment processing, stablecoin
            management, payment links, invoicing, fiat offramping, and merchant tools.
          </li>
          <li>
            <span className="font-medium">User:</span> Any individual or entity that
            accesses or uses the Services provided by the Company.
          </li>
          <li>
            <span className="font-medium">Merchant:</span> A User who uses our Services
            to accept payments, create invoices, or conduct business transactions.
          </li>
          <li>
            <span className="font-medium">Transaction:</span> Any action initiated
            through the Services that involves the transfer or exchange of digital
            assets, stablecoins, or fiat currency.
          </li>
          <li>
            <span className="font-medium">Wallet:</span> A digital wallet used to
            store, send, and receive cryptocurrency and digital assets, including
            both embedded wallets provided through Privy and external wallets.
          </li>
        </ul>
      </section>

      <Separator className="my-8 bg-slate-700/60" />

      {/* Services Overview */}
      <section id="services-overview" className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-100">
          2. Services Overview
        </h2>
        <p>
          NedaPay provides a comprehensive digital payment platform built on
          blockchain technology. Our Services include:
        </p>
        <ul className="ml-6 list-disc space-y-2 text-slate-300">
          <li>
            <span className="font-medium">Payment Processing:</span> Secure payment
            links, invoice creation and management, and transaction monitoring.
          </li>
          <li>
            <span className="font-medium">Stablecoin Management:</span> Real-time
            balance tracking, secure stablecoin transactions on Base Network, and
            integration with major stablecoins.
          </li>
          <li>
            <span className="font-medium">Fiat Offramping:</span> Direct USDC to
            fiat conversion with multiple currency support and integrated payment
            processors.
          </li>
          <li>
            <span className="font-medium">Merchant Tools:</span> Business verification
            (KYB), payment link generation, invoice management, and analytics.
          </li>
          <li>
            <span className="font-medium">Authentication Services:</span> Privy-powered
            authentication with embedded wallet support and social login integration.
          </li>
        </ul>
      </section>

      <Separator className="my-8 bg-slate-700/60" />

      {/* User Requirements */}
      <section id="user-requirements" className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-100">
          3. User Requirements
        </h2>
        <p>To use the Services, you must meet the following criteria:</p>
        <ul className="ml-6 list-disc space-y-2 text-slate-300">
          <li>
            <span className="font-medium">Age Requirement:</span> You must be at
            least 18 years old, or of legal age in your jurisdiction, to enter
            into a legally binding agreement.
          </li>
          <li>
            <span className="font-medium">Legal Capacity:</span> You must have the
            legal capacity and authority to enter into and be bound by these Terms.
          </li>
          <li>
            <span className="font-medium">Compliance with Laws:</span> You must
            comply with all applicable local, national, and international laws,
            regulations, and guidelines related to the use of the Services.
          </li>
          <li>
            <span className="font-medium">Account Accuracy:</span> You agree to
            provide accurate, current, and complete information, and to update
            this information as necessary.
          </li>
          <li>
            <span className="font-medium">Wallet Security:</span> You are responsible
            for safeguarding your wallet credentials, including private keys and
            seed phrases.
          </li>
        </ul>
      </section>

      <Separator className="my-8 bg-slate-700/60" />

      {/* Acceptable Use */}
      <section id="acceptable-use" className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-100">
          4. Acceptable Use
        </h2>
        <p>You agree to use the Services only for lawful purposes and in accordance with these Terms. Specifically, you agree:</p>
        
        <h3 className="text-lg font-medium text-slate-200 mt-4">Permitted Uses:</h3>
        <ul className="ml-6 list-disc space-y-2 text-slate-300">
          <li>To conduct legitimate business transactions and payments</li>
          <li>To create and manage payment links and invoices for lawful purposes</li>
          <li>To convert stablecoins to fiat currency through our offramping services</li>
          <li>To use our merchant tools for legitimate business operations</li>
        </ul>

        <h3 className="text-lg font-medium text-slate-200 mt-4">Prohibited Uses:</h3>
        <ul className="ml-6 list-disc space-y-2 text-slate-300">
          <li>Engaging in any fraudulent, unlawful, or harmful activities</li>
          <li>Money laundering, terrorist financing, or other illegal financial activities</li>
          <li>Violating any applicable financial regulations, sanctions, or AML laws</li>
          <li>Attempting to gain unauthorized access to our systems or other users' accounts</li>
          <li>Using the Services to process payments for illegal goods or services</li>
          <li>Manipulating or interfering with the proper functioning of the Services</li>
          <li>Creating multiple accounts to circumvent restrictions or limits</li>
        </ul>
      </section>

      <Separator className="my-8 bg-slate-700/60" />

      {/* KYC/KYB Requirements */}
      <section id="kyc-kyb" className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-100">
          5. Identity Verification (KYC/KYB)
        </h2>
        <p>
          To comply with regulatory requirements and ensure platform security,
          we may require identity verification:
        </p>
        <ul className="ml-6 list-disc space-y-2 text-slate-300">
          <li>
            <span className="font-medium">Individual KYC:</span> Personal identity
            verification including document upload, identity validation, and
            financial background assessment.
          </li>
          <li>
            <span className="font-medium">Business KYB:</span> Comprehensive business
            verification including business registration documents, ownership
            structure, and corporate compliance checks.
          </li>
          <li>
            <span className="font-medium">Ongoing Monitoring:</span> We reserve the
            right to request additional verification at any time to maintain
            compliance with applicable regulations.
          </li>
          <li>
            <span className="font-medium">Third-Party Verification:</span> We use
            Sumsub and other trusted third-party providers to perform identity
            verification services.
          </li>
        </ul>
      </section>

      <Separator className="my-8 bg-slate-700/60" />

      {/* Payment Terms */}
      <section id="payment-terms" className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-100">
          6. Payment Terms
        </h2>
        <ul className="ml-6 list-disc space-y-2 text-slate-300">
          <li>
            <span className="font-medium">Transaction Fees:</span> We may charge
            fees for certain Services, which will be clearly disclosed before
            you complete any transaction.
          </li>
          <li>
            <span className="font-medium">Gas Fees:</span> Blockchain transactions
            may incur network gas fees. For embedded wallet users, we provide
            gas abstraction where applicable.
          </li>
          <li>
            <span className="font-medium">Exchange Rates:</span> For fiat offramping
            services, exchange rates are determined at the time of transaction
            and may fluctuate based on market conditions.
          </li>
          <li>
            <span className="font-medium">Payment Processing:</span> All payments
            are processed on blockchain networks and are generally irreversible
            once confirmed.
          </li>
          <li>
            <span className="font-medium">Refunds:</span> Refunds are handled only if transactions are not processed successfully and if it is a mistake on our side.
          </li>
        </ul>
      </section>

      <Separator className="my-8 bg-slate-700/60" />

      {/* Intellectual Property */}
      <section id="intellectual-property" className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-100">
          7. Intellectual Property
        </h2>
        <h3 className="text-lg font-medium text-slate-200">Company IP</h3>
        <p className="text-slate-300">
          All intellectual property rights in the Services, including trademarks,
          logos, and content, are owned by Neda Labs Ltd. You are granted a limited,
          non-exclusive, non-transferable license to use the Services solely for
          personal or business purposes in accordance with these Terms.
        </p>
        
        <h3 className="text-lg font-medium text-slate-200 mt-4">User Submissions</h3>
        <p className="text-slate-300">
          By submitting any materials to the Services, including feedback, transaction
          data, or support requests, you grant the Company a worldwide, royalty-free,
          and non-exclusive license to use, reproduce, modify, and distribute those
          materials for purposes related to operating and improving the Services.
        </p>
      </section>

      <Separator className="my-8 bg-slate-700/60" />

      {/* Privacy and Data Protection */}
      <section id="privacy" className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-100">
          8. Privacy and Data Protection
        </h2>
        <p className="text-slate-300">
          Please refer to our{" "}
          <Link
            href="/(legal)/privacy-policy"
            className="underline underline-offset-4"
          >
            Privacy Policy
          </Link>{" "}
          for information about how we collect, use, and share your information.
          By using our Services, you consent to the collection and use of your
          information in accordance with our Privacy Policy.
        </p>
        <p className="text-slate-300">
          We implement reasonable security measures to protect your data, but
          cannot guarantee absolute security. You acknowledge that data transmission
          over the internet carries inherent risks.
        </p>
      </section>

      <Separator className="my-8 bg-slate-700/60" />

      {/* Security and User Responsibility */}
      <section id="security" className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-100">
          9. Security and User Responsibility
        </h2>
        <p>
          You are responsible for maintaining the security of your account and
          wallet. This includes:
        </p>
        <ul className="ml-6 list-disc space-y-2 text-slate-300">
          <li>
            <span className="font-medium">Wallet Security:</span> Keep your
            cryptocurrency wallet private keys and recovery phrases confidential.
            Never share this information with anyone.
          </li>
          <li>
            <span className="font-medium">Strong Security Practices:</span> Use
            strong, unique passwords and enable two-factor authentication where
            available.
          </li>
          <li>
            <span className="font-medium">Regular Monitoring:</span> Frequently
            review your wallet and transaction history for unauthorized activity.
          </li>
          <li>
            <span className="font-medium">Phishing Awareness:</span> Be cautious
            of phishing attempts. We will never request your wallet keys or
            sensitive information through unsolicited communications.
          </li>
          <li>
            <span className="font-medium">Reporting:</span> Immediately report
            any suspected unauthorized access or suspicious activity.
          </li>
        </ul>
      </section>

      <Separator className="my-8 bg-slate-700/60" />

      {/* Limitation of Liability */}
      <section id="limitation-liability" className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-100">
          10. Limitation of Liability
        </h2>
        
        <h3 className="text-lg font-medium text-slate-200">No Warranty</h3>
        <p className="text-slate-300">
          The Services are provided on an "as is" and "as available" basis. We
          make no warranties, express or implied, regarding the Services, including
          but not limited to warranties of merchantability, fitness for a particular
          purpose, or non-infringement.
        </p>

        <h3 className="text-lg font-medium text-slate-200 mt-4">Limitation of Damages</h3>
        <p className="text-slate-300">
          To the maximum extent permitted by law, we will not be liable for any
          indirect, incidental, special, consequential, or punitive damages,
          including but not limited to:
        </p>
        <ul className="ml-6 list-disc space-y-2 text-slate-300">
          <li>Loss of profits, revenues, data, or business opportunities</li>
          <li>Damages arising from your use or inability to use the Services</li>
          <li>Unauthorized access to your wallet or personal information</li>
          <li>Interruption or cessation of service transmission</li>
          <li>Blockchain network failures or delays</li>
          <li>Third-party service provider failures</li>
        </ul>
      </section>

      <Separator className="my-8 bg-slate-700/60" />

      {/* Governing Law */}
      <section id="governing-law" className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-100">
          11. Governing Law and Dispute Resolution
        </h2>
        <p className="text-slate-300">
          These Terms are governed by and construed in accordance with the laws
          of the jurisdiction where Neda Labs Ltd is incorporated. Any disputes
          arising from these Terms or your use of the Services will be resolved
          through binding arbitration in accordance with the rules of the relevant
          arbitration authority.
        </p>
        <p className="text-slate-300">
          Before initiating any formal dispute resolution, we encourage you to
          contact us directly at{" "}
          <Link
            href="mailto:support@nedapay.xyz"
            className="underline underline-offset-4"
          >
            support@nedapay.xyz
          </Link>{" "}
          to resolve any issues informally.
        </p>
      </section>

      <Separator className="my-8 bg-slate-700/60" />

      {/* Modifications */}
      <section id="modifications" className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-100">
          12. Modifications to Terms and Services
        </h2>
        <p className="text-slate-300">
          We reserve the right to modify these Terms at any time. We will notify
          you of material changes by posting the updated Terms on our website
          and updating the "Last updated" date. Your continued use of the Services
          after such changes constitutes acceptance of the new Terms.
        </p>
        <p className="text-slate-300">
          We may also modify, suspend, or discontinue any aspect of the Services
          at any time, with or without notice. We will not be liable for any
          modification, suspension, or discontinuation of the Services.
        </p>
      </section>

      <Separator className="my-8 bg-slate-700/60" />

      {/* Termination */}
      <section id="termination" className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-100">
          13. Termination
        </h2>
        <p className="text-slate-300">
          You may terminate your use of the Services at any time by discontinuing
          access to our platform. We may terminate or suspend your access to the
          Services immediately, without prior notice, if you breach these Terms
          or engage in prohibited activities.
        </p>
        <p className="text-slate-300">
          Upon termination, your right to use the Services will cease immediately.
          However, any transactions already initiated may continue to be processed
          according to blockchain network protocols.
        </p>
      </section>

      <Separator className="my-8 bg-slate-700/60" />

      {/* Miscellaneous */}
      <section id="miscellaneous" className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-100">
          14. Miscellaneous
        </h2>
        <ul className="ml-6 list-disc space-y-2 text-slate-300">
          <li>
            <span className="font-medium">Entire Agreement:</span> These Terms
            constitute the entire agreement between you and NedaPay regarding
            the Services.
          </li>
          <li>
            <span className="font-medium">Severability:</span> If any provision
            of these Terms is found to be unenforceable, the remaining provisions
            will remain in full force and effect.
          </li>
          <li>
            <span className="font-medium">Waiver:</span> Our failure to enforce
            any provision of these Terms does not constitute a waiver of that
            provision.
          </li>
          <li>
            <span className="font-medium">Assignment:</span> You may not assign
            your rights under these Terms without our prior written consent.
            We may assign our rights at any time.
          </li>
          <li>
            <span className="font-medium">Force Majeure:</span> We will not be
            liable for any failure to perform due to circumstances beyond our
            reasonable control.
          </li>
        </ul>
      </section>

      <Separator className="my-8 bg-slate-700/60" />

      {/* Contact */}
      <section id="contact" className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-100">
          15. Contact Information
        </h2>
        <p className="text-slate-300">
          If you have any questions about these Terms or need support, please
          contact us:
        </p>
        <ul className="ml-6 list-disc space-y-2 text-slate-300">
          <li>
            Email:{" "}
            <Link
              href="mailto:support@nedapay.xyz"
              className="underline underline-offset-4"
            >
              support@nedapay.xyz
            </Link>
          </li>
          <li>
            Legal inquiries:{" "}
            <Link
              href="mailto:legal@nedapay.xyz"
              className="underline underline-offset-4"
            >
              legal@nedapay.xyz
            </Link>
          </li>
          <li>
            Website:{" "}
            <Link
              href="https://nedapay.xyz"
              className="underline underline-offset-4"
            >
              nedapay.xyz
            </Link>
          </li>
        </ul>
      </section>

      <Separator className="my-12 bg-slate-700/60" />

      {/* Acknowledgment */}
      <footer className="rounded-xl border border-slate-700/60 bg-gradient-to-tr from-indigo-900/40 via-purple-900/30 to-blue-900/30 p-4 text-xs leading-relaxed text-slate-400">
        <p>
          <span className="font-semibold text-slate-300">
            Acknowledgment:
          </span>{" "}
          By using NedaPay's Services, you acknowledge that you have read,
          understood, and agree to be bound by these Terms of Service. You also
          acknowledge the risks associated with cryptocurrency transactions and
          digital asset management.
        </p>
      </footer>
    </main>
  );
}
