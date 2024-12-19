"use client";

import { useEffect, useState } from "react";
import { NextPage } from "next";
import { TypedDataDefinition } from "viem";
import { SignatureMessage } from "~~/components/signatorio/SignatureMessage";
import { SignaturesList } from "~~/components/signatorio/SignaturesList";
import { useSignatureVerification } from "~~/hooks/signatorio/useSignatureVerification";
import { messagesTable, signaturesTable } from "~~/services/db/schema";

const ViewSignature: NextPage<{ params: { id: string } }> = ({ params }: { params: { id: string } }) => {
  const { id } = params;

  const [message, setMessage] = useState<string | null>(null);
  const [typedData, setTypedData] = useState<TypedDataDefinition | null>(null);
  const [signatures, setSignatures] = useState<string[]>([]);
  const [addresses, setAddresses] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const addressChecks = useSignatureVerification(message, typedData, signatures, addresses);

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch(`/api/signatures/${id}`);

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const { message, signatures } = (await res.json()) as {
          message: typeof messagesTable.$inferSelect;
          signatures: (typeof signaturesTable.$inferSelect)[];
        };

        if (!message) {
          throw new Error("Message not found");
        }

        if (message.type === "text") {
          setMessage(message.message);
        } else if (message.type === "typed_data") {
          try {
            setTypedData(JSON.parse(message.message));
          } catch (e) {
            throw new Error("Invalid typed data format");
          }
        } else {
          throw new Error("Invalid message type");
        }

        setSignatures(signatures?.map(s => s.signature) ?? []);
        setAddresses(signatures?.map(s => s.signer) ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessage();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center flex-grow">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center flex-grow">
        <div className="px-5 container max-w-screen-sm">
          <div className="alert alert-error">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="px-5 container max-w-screen-sm">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body gap-4">
            <SignatureMessage message={message} typedData={typedData} />
            <SignaturesList signatures={signatures} addresses={addresses} addressChecks={addressChecks} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewSignature;