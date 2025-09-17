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

const effectiveDate = "September 17, 2025"; // keep this current when you ship updates

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12 text-slate-200">
      {/* Header */}
      <section className="mb-10">
        <Badge className="mb-4 bg-indigo-700/60 text-indigo-50">Legal</Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl bg-gradient-to-r from-indigo-300 via-purple-300 to-blue-300 bg-clip-text text-transparent">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          Last updated: {effectiveDate}
        </p>
        <p className="mt-6 text-slate-300">
          This Privacy Policy explains how{" "}
          <span className="font-semibold">Neda Labs Ltd</span> ("
          <strong>NedaPay</strong>""<strong>we</strong>", "<strong>us</strong>",
          or "<strong>our</strong>") collects, uses, shares, and protects
          information about you when you use our websites, apps, and services
          (collectively, the "<strong>Services</strong>"). By accessing or using
          the Services, you agree to this Privacy Policy and our{" "}
          <Link href="/legal/terms" className="underline underline-offset-4">
            Terms of Service
          </Link>
          .
        </p>
        <Card className="mt-6 border-slate-700/60 bg-slate-900/40">
          <CardHeader>
            <CardTitle className="text-slate-100">At-a-glance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-slate-300">
            <p>
              We use{" "}
              <Link
                href="https://www.privy.io/privacy-policy"
                target="_blank"
                className="underline underline-offset-4"
              >
                Privy
              </Link>{" "}
              for authentication and key management and{" "}
              <Link
                href="https://sumsub.com/privacy-notice-service/"
                target="_blank"
                className="underline underline-offset-4"
              >
                Sumsub
              </Link>{" "}
              to perform identity verification (KYC/AML). These vendors act as
              our processors, and we only share the minimum data needed for them
              to provide their services.
            </p>
            <p>
              You have controls over your data, including rights to access,
              delete, or object, and choices around cookies. See{" "}
              <Link
                href="#your-rights"
                className="underline underline-offset-4"
              >
                Your Rights & Choices
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </section>

      <Separator className="my-8 bg-slate-700/60" />

      {/* Who we are */}
      <section id="who-we-are" className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-100">
          1. Who we are & scope
        </h2>
        <p>
          NedaPay operates the Services available at{" "}
          <Link
            href="https://nedapay.xyz"
            className="underline underline-offset-4"
          >
            nedapay.xyz
          </Link>
          . This Privacy Policy applies to personal data we process about
          visitors, applicants, customers, and end users of our Services.
        </p>
        <p className="text-slate-300">
          {/* <span className="font-medium">Controller:</span> <span className="italic">[Insert legal entity name, company number, and registered address]</span>. */}
          <br />
          <span className="font-medium">Contact:</span>{" "}
          <Link
            href="mailto:privacy@nedapay.xyz"
            className="underline underline-offset-4"
          >
            support@nedapay.xyz
          </Link>
          .
          <br />
          {/* <span className="font-medium">EU/UK representative (if applicable):</span> <span className="italic">[Insert details]</span>. */}
          <br />
          {/* <span className="font-medium">Data Protection Officer (if appointed):</span> <span className="italic">[Insert DPO contact]</span>. */}
        </p>
      </section>

      <Separator className="my-8 bg-slate-700/60" />

      {/* Data we collect */}
      <section id="data-we-collect" className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-100">
          2. The data we collect
        </h2>
        <p>
          We collect the following categories of personal data, depending on how
          you interact with us:
        </p>
        <ul className="ml-6 list-disc space-y-2 text-slate-300">
          <li>
            <span className="font-medium">Account & authentication data</span>{" "}
            (via Privy): identifiers (e.g., name, email/handle), cryptographic
            public keys, wallet identifiers, linked accounts, session and
            authentication metadata, and audit logs.
          </li>
          <li>
            <span className="font-medium">Identity & compliance data</span> (via
            Sumsub): government ID data, selfies and facial imagery, biometric
            templates processed for liveness/face match, date of birth,
            nationality, address, and sanctions/PEP screening results.
          </li>
          <li>
            <span className="font-medium">Usage & device data:</span> logs about
            how you interact with the Services (e.g., pages viewed, timestamps),
            device and network identifiers, and approximate location derived
            from IP.
          </li>
          <li>
            <span className="font-medium">Transactional data:</span> on-platform
            activity such as funding, transfers, and other actions you take,
            including related metadata necessary to operate the Services and
            comply with law.
          </li>
          <li>
            <span className="font-medium">Communications:</span> messages you
            send us (support requests, feedback) and associated metadata.
          </li>
          <li>
            <span className="font-medium">
              Cookies and similar technologies:
            </span>{" "}
            see our{" "}
            <Link
              href="/legal/cookies"
              className="underline underline-offset-4"
            >
              Cookie Policy
            </Link>{" "}
            for details and choices.
          </li>
        </ul>
        <p className="text-slate-400 text-sm">
          Note: We do not intentionally collect data from children.
        </p>
      </section>

      <Separator className="my-8 bg-slate-700/60" />

      {/* Sources */}
      <section id="sources" className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-100">
          3. Where data comes from
        </h2>
        <ul className="ml-6 list-disc space-y-2 text-slate-300">
          <li>
            Directly from you (e.g., during sign-up, profile completion,
            support).
          </li>
          <li>
            Automatically from your device and usage of the Services (e.g.,
            logs, cookies).
          </li>
          <li>
            From service providers acting on our instructions (e.g., Privy,
            Sumsub).
          </li>
          {/* <li>From public sources or third parties where lawful (e.g., sanctions lists).</li> */}
        </ul>
      </section>

      <Separator className="my-8 bg-slate-700/60" />

      {/* Purposes & lawful bases */}
      <section id="purposes" className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-100">
          4. How we use personal data (and legal bases)
        </h2>
        <p>We use personal data to:</p>
        <ul className="ml-6 list-disc space-y-2 text-slate-300">
          <li>
            Provide and maintain the Services, including authentication,
            wallets, onboarding, and support (
            <span className="italic">performance of a contract</span>).
          </li>
          <li>
            Conduct identity verification, sanctions/PEP screening, fraud
            prevention, and other compliance checks (
            <span className="italic">legal obligation</span>;{" "}
            <span className="italic">public interest</span> where applicable).
          </li>
          <li>
            Protect the Services, detect abuse, and ensure security (
            <span className="italic">legitimate interests</span>).
          </li>
          <li>
            Communicate with you about updates, features, and policy changes (
            <span className="italic">legitimate interests</span> or{" "}
            <span className="italic">consent</span> where required).
          </li>
          <li>
            Improve and develop the Services, including analytics and research (
            <span className="italic">legitimate interests</span> and/or{" "}
            <span className="italic">consent</span> for non-essential cookies).
          </li>
          <li>
            Comply with applicable laws, lawful requests, and enforce our terms
            (<span className="italic">legal obligation</span>).
          </li>
        </ul>
      </section>

      <Separator className="my-8 bg-slate-700/60" />

      {/* Sharing */}
      <section id="sharing" className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-100">
          5. How we share information
        </h2>
        <p>We do not sell your personal data. We share it only as follows:</p>
        <ul className="ml-6 list-disc space-y-2 text-slate-300">
          <li>
            <span className="font-medium">Service providers/Processors:</span>{" "}
            We use vetted vendors under contract and data protection terms.
          </li>
          <li>
            <span className="font-medium">Compliance and safety:</span> Courts,
            regulators, or law enforcement where required by law or to protect
            rights, security, and integrity of the Services.
          </li>
          <li>
            <span className="font-medium">Business transfers:</span> In
            connection with mergers, acquisitions, financing, or sale of assets,
            subject to appropriate safeguards.
          </li>
        </ul>
        <p className="text-slate-400 text-sm">
          We require processors to process personal data only on our documented
          instructions and to implement appropriate security measures.
        </p>
      </section>

      <Separator className="my-8 bg-slate-700/60" />

      {/* International transfers */}
      {/* <section id="transfers" className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-100">6. International data transfers</h2>
        <p>
          We may transfer personal data internationally, including to countries that may not provide the same level of data protection as your jurisdiction. Where required, we use appropriate safeguards—such as the EU Standard Contractual Clauses (and UK Addendum) or adequacy decisions—and implement supplementary measures as needed.
        </p>
      </section> */}

      <Separator className="my-8 bg-slate-700/60" />

      {/* Retention */}
      <section id="retention" className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-100">
          8. Data retention
        </h2>
        <p>
          We keep personal data only as long as necessary for the purposes
          described in this Policy, including to comply with legal, accounting,
          or reporting obligations (e.g., financial recordkeeping and AML
          requirements). Retention periods vary by data category and legal
          requirements. When we no longer need personal data, we delete or
          anonymize it.
        </p>
      </section>

      <Separator className="my-8 bg-slate-700/60" />

      {/* Security */}
      <section id="security" className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-100">9. Storage, Security and Risk Mitigation</h2>
        <p>
          We do not Store any sensitive data in our end, but we use third-party
          services/providers which are vetted and have strict security measures
          in place. No system is perfectly secure; you are responsible for
          maintaining the confidentiality of your credentials and assets and
          promptly notifying us of any suspected compromise.
        </p>
      </section>

      <Separator className="my-8 bg-slate-700/60" />

      {/* Your rights */}
      <section id="your-rights" className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-100">
          10. Your rights & choices
        </h2>
        <p>
          Depending on your location, you may have rights to access, correct,
          delete, receive a copy of, or object your personal data. You may also
          withdraw consent where we rely on it. To exercise these rights,
          contact us at{" "}
          <Link
            href="mailto:legal@nedapay.xyz"
            className="underline underline-offset-4"
          >
            legal@nedapay.xyz
          </Link>
          . We may need to verify your identity before processing a request.
        </p>
        <Accordion
          type="multiple"
          className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-2"
        >
          <AccordionItem value="eea">
            <AccordionTrigger className="text-slate-100">
              EEA/UK (GDPR)
            </AccordionTrigger>
            <AccordionContent className="text-slate-300">
              If you are in the EEA or UK, you have GDPR rights including
              access, rectification, erasure, portability, restriction, and
              objection to processing, and rights related to automated
              decision-making. You also have the right to lodge a complaint with
              your supervisory authority. Where we rely on legitimate interests,
              you may object where your rights and freedoms outweigh our
              interests.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="california">
            <AccordionTrigger className="text-slate-100">
              California and other U.S state laws
            </AccordionTrigger>
            <AccordionContent className="text-slate-300">
              Depending on your state, you may have rights to know / access,
              delete, correct, opt-out of the “sale” or “sharing” of personal
              information and targeted advertising, and to limit use of
              “sensitive” personal information. We do not sell personal
              information. If our practices change to involve “sharing” for
              cross-context behavioural advertising, we will provide required
              opt-out mechanisms and honor Global Privacy Control signals.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="cookies">
            <AccordionTrigger className="text-slate-100">
              Cookies & analytics choices
            </AccordionTrigger>
            <AccordionContent className="text-slate-300">
              You can manage non-essential cookies and similar technologies
              through our{" "}
              <Link
                href="/legal/cookies"
                className="underline underline-offset-4"
              >
                Cookie Policy
              </Link>
              , your browser settings, and device-level controls. Some features
              may not function properly without certain cookies.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <Separator className="my-8 bg-slate-700/60" />

      {/* Automated decisions */}
      {/* <section id="automated" className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-100">
          10. Automated decision-making
        </h2>
        <p>
          We may use automated systems to assist with risk scoring, fraud
          detection, sanctions screening, and identity verification. These
          processes help us meet legal obligations and protect the integrity of
          the Services. Where required by law, we provide meaningful information
          about the logic involved and the possible consequences, and we offer
          ways to request human review.
        </p>
      </section> */}

      <Separator className="my-8 bg-slate-700/60" />

      {/* Children */}
      <section id="children" className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-100">
          10. Children’s privacy
        </h2>
        <p>
          The Services are not directed to children. We do not knowingly collect
          personal data from anyone under the age where parental consent is
          required in their jurisdiction. If you believe a child has provided us
          personal data, please contact us and we will take appropriate steps to
          delete it.
        </p>
      </section>

      <Separator className="my-8 bg-slate-700/60" />

      {/* Third-party services */}
      <section id="vendors" className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-100">
          11. Third-party services we use
        </h2>
        <ul className="ml-6 list-disc space-y-2 text-slate-300">
          <li>
            <span className="font-medium">
              Privy (authentication & key management):
            </span>{" "}
            we use Privy to authenticate users and help manage wallet keys.
          </li>
          <li>
            <span className="font-medium">Sumsub (identity verification):</span>{" "}
            we use Sumsub to verify identity and perform AML checks. Sumsub acts
            as our processor.
          </li>
          <li>
            <span className="font-medium">
              Payment Rails / Liquidity Providers
            </span>{" "}
            we use Payment Rails Providers to process payments and provide liquidity for our services.
          </li>
        </ul>
        <p className="text-slate-400 text-sm">
          These services may process your personal data on our behalf to provide
          the features you request and to help us meet legal obligations.
        </p>
      </section>

      <Separator className="my-8 bg-slate-700/60" />

      {/* Changes */}
      <section id="changes" className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-100">
          12. Changes to this Policy
        </h2>
        <p>
          We may update this Privacy Policy from time to time. We will post the
          updated version and revise the “Last updated” date above. If changes
          materially affect your rights, we will provide additional notice as
          required by law.
        </p>
      </section>

      <Separator className="my-8 bg-slate-700/60" />

      {/* Contact */}
      <section id="contact" className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-100">
          13. Contact us
        </h2>
        <p>
          Questions or requests? Email{" "}
          <Link
            href="mailto:support@nedapay.xyz"
            className="underline underline-offset-4"
          >
            support@nedapay.xyz
          </Link>
          .
        </p>
      </section>

      <Separator className="my-12 bg-slate-700/60" />

      {/* Compliance notes */}
      {/* <footer className="rounded-xl border border-slate-700/60 bg-gradient-to-tr from-indigo-900/40 via-purple-900/30 to-blue-900/30 p-4 text-xs leading-relaxed text-slate-400">
        <p>
          <span className="font-semibold text-slate-300">
            Compliance notes:
          </span>{" "}
          This policy is designed to be compatible with GDPR (EEA/UK), CCPA/CPRA
          (California), and general AML/KYC obligations. It does not constitute
          legal advice. Please tailor controller details, retention schedules,
          and region-specific disclosures before publishing.
        </p>
      </footer> */}
    </main>
  );
}
