/**
 * Business KYB step: business details + document upload → poll KYB status.
 */

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useOnboardingStore } from "@/store/onboarding.store";
import { useKycStore } from "@/store/kyc.store";
import {
  submitBusinessDetails,
  uploadBusinessDocuments,
  getKybStatus,
} from "@/services/kyb.service";
import { parseApiError } from "@/utils/parseApiError";

interface BusinessForm {
  businessName: string;
  registrationNumber: string;
  country: string;
  address: string;
}

const initialForm: BusinessForm = {
  businessName: "",
  registrationNumber: "",
  country: "",
  address: "",
};

export default function BusinessStep() {
  const { prevStep, setLoading, setError, loading, error } = useOnboardingStore();
  const { kybStatus, polling, startPolling, stopPolling } = useKycStore();
  const [form, setForm] = useState<BusinessForm>(initialForm);
  const [documents, setDocuments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!form.businessName.trim() || !form.country.trim()) {
      setError("Please fill required fields: business name, country.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await submitBusinessDetails({
        businessName: form.businessName.trim(),
        registrationNumber: form.registrationNumber.trim() || undefined,
        country: form.country.trim(),
        address: form.address.trim() || undefined,
      });
      if (documents.length > 0) {
        const formData = new FormData();
        documents.forEach((file) => {
          formData.append("documents", file);
          formData.append("documentType", file.name.split(".").pop() ?? "document");
        });
        await uploadBusinessDocuments(formData);
      }
      startPolling(async () => {
        const res = await getKybStatus();
        return { kyb: res.status };
      });
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) setDocuments((prev) => [...prev, ...Array.from(files)]);
  };

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const isTerminal = kybStatus === "APPROVED" || kybStatus === "REJECTED";

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Business details</h2>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business name *</Label>
            <Input
              id="businessName"
              value={form.businessName}
              onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="registrationNumber">Registration number</Label>
            <Input
              id="registrationNumber"
              value={form.registrationNumber}
              onChange={(e) => setForm((f) => ({ ...f, registrationNumber: e.target.value }))}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country *</Label>
            <Input
              id="country"
              value={form.country}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label>Documents (optional)</Label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              Add files
            </Button>
            {documents.length > 0 && (
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                {documents.map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span>{f.name}</span>
                    <button
                      type="button"
                      className="text-destructive hover:underline"
                      onClick={() => removeDocument(i)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      {polling && (
        <p className="text-sm text-muted-foreground">
          Status: {kybStatus ?? "Checking…"}
        </p>
      )}
      {isTerminal && (
        <p className="text-sm font-medium">
          {kybStatus === "APPROVED" ? "Verification approved." : "Verification was not approved."}
        </p>
      )}

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => { stopPolling(); prevStep(); }} disabled={loading}>
          Back
        </Button>
        {!isTerminal && (
          <Button onClick={handleSubmit} disabled={loading || polling}>
            {loading ? "Submitting…" : polling ? "Verifying…" : "Submit"}
          </Button>
        )}
      </div>
    </div>
  );
}
