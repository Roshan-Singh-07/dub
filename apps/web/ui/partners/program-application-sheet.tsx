"use client";

import { createProgramApplicationAction } from "@/lib/actions/partners/create-program-application";
import usePartnerProfile from "@/lib/swr/use-partner-profile";
import { ProgramProps } from "@/lib/types";
import { createProgramApplicationSchema } from "@/lib/zod/schemas/programs";
import { X } from "@/ui/shared/icons";
import { Button, Link4, Sheet } from "@dub/ui";
import { cn, OG_AVATAR_URL } from "@dub/utils";
import { useAction } from "next-safe-action/hooks";
import { Dispatch, SetStateAction, useState } from "react";
import { useForm } from "react-hook-form";
import ReactTextareaAutosize from "react-textarea-autosize";
import { toast } from "sonner";
import { mutate } from "swr";
import { z } from "zod";

interface ProgramApplicationSheetProps {
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  program?: ProgramProps;
  onSuccess?: () => void;
}

type FormData = Omit<
  z.infer<typeof createProgramApplicationSchema>,
  "name" | "email" | "website"
> & {
  termsAgreement: boolean;
};

function ProgramApplicationSheetContent({
  setIsOpen,
  program,
  onSuccess,
}: ProgramApplicationSheetProps) {
  const { partner } = usePartnerProfile();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<FormData>({
    defaultValues: {
      termsAgreement: false,
    },
  });

  const { executeAsync } = useAction(createProgramApplicationAction, {
    onSuccess: () => {
      setIsOpen(false);
      mutate(`/api/partner-profile/programs/${program!.slug}`);
      toast.success("Application submitted!");
      onSuccess?.();
    },
    onError({ error }) {
      setError("root.serverError", {
        message: error.serverError || "Failed to submit application",
      });
      toast.error(error.serverError || "Failed to submit application");
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!program || !partner?.email) return;

    await executeAsync({
      ...data,
      email: partner.email,
      name: partner.name,
      website: partner.website ?? undefined,
      programId: program.id,
    });
  };

  if (!program) return null;

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-col">
        <div className="flex items-start justify-between bg-neutral-50 p-6">
          <Sheet.Title asChild className="min-w-0">
            <div>
              <div className="flex items-center gap-3">
                <img
                  src={program.logo || `${OG_AVATAR_URL}${program.name}`}
                  alt={program.name}
                  className="size-10 rounded-full border border-black/10"
                />
                <div className="min-w-0">
                  <span className="block truncate text-base font-semibold leading-tight text-neutral-900">
                    {program.name}
                  </span>

                  <div className="flex items-center gap-1 text-neutral-500">
                    <Link4 className="size-3 shrink-0" />
                    <span className="min-w-0 truncate text-sm font-medium">
                      {program.domain}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Sheet.Title>
          <Sheet.Close asChild>
            <Button
              variant="outline"
              icon={<X className="size-5" />}
              className="h-auto w-fit p-1"
            />
          </Sheet.Close>
        </div>

        <div className="flex flex-col gap-6 p-5 sm:p-8">
          <label>
            <span className="text-sm font-medium text-neutral-800">
              How do you plan to promote {program.name}?
            </span>
            <ReactTextareaAutosize
              className={cn(
                "mt-2 block max-h-48 min-h-12 w-full rounded-md focus:outline-none sm:text-sm",
                errors.proposal
                  ? "border-red-400 pr-10 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500"
                  : "border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-[var(--brand)] focus:ring-[var(--brand)]",
              )}
              placeholder=""
              minRows={3}
              {...register("proposal", { required: true })}
            />
          </label>

          <label>
            <span className="text-sm font-medium text-neutral-800">
              Any additional questions or comments?
              <span className="font-normal text-neutral-500"> (optional)</span>
            </span>
            <ReactTextareaAutosize
              className={cn(
                "mt-2 block max-h-48 min-h-12 w-full rounded-md focus:outline-none sm:text-sm",
                errors.comments
                  ? "border-red-400 pr-10 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500"
                  : "border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-[var(--brand)] focus:ring-[var(--brand)]",
              )}
              placeholder=""
              minRows={3}
              {...register("comments")}
            />
          </label>

          {program.termsUrl && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="termsAgreement"
                className={cn(
                  "h-4 w-4 rounded border-neutral-300 text-[var(--brand)] focus:ring-[var(--brand)]",
                  errors.termsAgreement && "border-red-400 focus:ring-red-500",
                )}
                {...register("termsAgreement", {
                  required: true,
                  validate: (v) => v === true,
                })}
              />
              <label
                htmlFor="termsAgreement"
                className="text-sm text-neutral-800"
              >
                I agree to the{" "}
                <a
                  href={program.termsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--brand)] underline hover:opacity-80"
                >
                  {program.name} Partner Program Terms ↗
                </a>
              </label>
            </div>
          )}
        </div>

        <div className="flex grow flex-col justify-end p-5">
          <Button
            type="submit"
            variant="primary"
            text="Submit application"
            loading={isSubmitting || isSubmitSuccessful}
          />
        </div>
      </form>
    </>
  );
}

export function ProgramApplicationSheet({
  isOpen,
  nested,
  ...rest
}: ProgramApplicationSheetProps & {
  isOpen: boolean;
  nested?: boolean;
}) {
  return (
    <Sheet open={isOpen} onOpenChange={rest.setIsOpen} nested={nested}>
      <ProgramApplicationSheetContent {...rest} />
    </Sheet>
  );
}

export function useProgramApplicationSheet(
  props: Omit<ProgramApplicationSheetProps, "setIsOpen">,
) {
  const [isOpen, setIsOpen] = useState(false);

  return {
    programApplicationSheet: (
      <ProgramApplicationSheet
        setIsOpen={setIsOpen}
        isOpen={isOpen}
        {...props}
      />
    ),
    setIsOpen,
  };
}
