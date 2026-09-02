import React from "react";
import { Button } from "@/components/ui/button";
import { CompanyName } from "@/config";
import { useNavigate } from "react-router-dom";

function TermsOfUse() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-green-50 px-6 py-10 flex justify-center items-center">
      <div className="max-w-5xl w-full bg-white rounded-lg shadow p-8">

        <h1 className="text-3xl font-bold text-center mb-6">
          {CompanyName} – Terms of Use
        </h1>

        {/* ✅ SCROLLABLE CONTENT AREA */}
        <div className="space-y-5 text-sm text-gray-700 leading-relaxed max-h-[65vh] overflow-y-auto pr-3">

          <p>
            Welcome to <b>{CompanyName}</b>. These Terms of Use govern your access
            to and use of our electric vehicle charging platform, applications,
            and services.
          </p>

          <h3 className="font-semibold text-base">1. Acceptance of Terms</h3>
          <p>
            By registering or using our services, you confirm that you accept
            these Terms of Use and agree to comply with them.
          </p>

          <h3 className="font-semibold text-base">2. Service Overview</h3>
          <p>
            {CompanyName} provides access to EV charging stations worldwide,
            enabling users to locate, reserve, and charge their electric
            vehicles efficiently.
          </p>

          <h3 className="font-semibold text-base">3. User Responsibilities</h3>
          <ul className="list-disc ml-6 space-y-1">
            <li>You must provide accurate registration information.</li>
            <li>You are responsible for maintaining account security.</li>
            <li>You must not misuse charging infrastructure.</li>
            <li>You must comply with all local laws and regulations.</li>
          </ul>

          <h3 className="font-semibold text-base">4. Payments & Usage</h3>
          <p>
            Charging sessions are billed based on energy usage and pricing
            policies defined by the station operator. All payments are final.
          </p>

          <h3 className="font-semibold text-base">5. Service Availability</h3>
          <p>
            While we strive for 24/7 availability, uninterrupted access is not
            guaranteed due to maintenance or technical issues.
          </p>

          <h3 className="font-semibold text-base">6. Account Termination</h3>
          <p>
            {CompanyName} reserves the right to suspend or terminate accounts
            for misuse, fraud, or violation of these terms.
          </p>

          <h3 className="font-semibold text-base">7. Limitation of Liability</h3>
          <p>
            {CompanyName} shall not be liable for indirect damages, charging
            failures, vehicle issues, or power interruptions.
          </p>

          <h3 className="font-semibold text-base">8. Privacy Policy</h3>
          <p>
            Your data is handled according to our Privacy Policy and used only
            for providing EV charging services.
          </p>

          <h3 className="font-semibold text-base">9. Modifications</h3>
          <p>
            These terms may be updated at any time. Continued use of the
            platform implies acceptance of the revised terms.
          </p>

          <h3 className="font-semibold text-base">10. Contact</h3>
          <p>
            For support or questions, contact {CompanyName} through the official
            support channels.
          </p>
        </div>

        {/* ✅ BUTTON FIXED BELOW SCROLL */}
        <div className="flex justify-center pt-8">
          <Button
            className="bg-green-600 hover:bg-green-700 px-6"
            onClick={() => navigate(-1)}
          >
            I Agree & Go Back
          </Button>
        </div>

      </div>
    </div>
  );
}

export default TermsOfUse;
