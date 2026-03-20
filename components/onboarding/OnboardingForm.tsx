/**
 * OnboardingForm.tsx
 *
 * Multi-step onboarding wizard (5 steps) that collects the user's profile:
 *   Step 1: Name
 *   Step 2: Job type / role
 *   Step 3: Location (country)
 *   Step 4: Attendance days (Day 1, Day 2, or Both)
 *   Step 5: Interest topics (multi-select with search)
 *
 * Uses React Hook Form + Zod for per-step validation. Each step validates
 * only its own fields before allowing progression to the next step.
 *
 * Visual layer: glass-card surface, cyan accent, gradient CTA button, Framer Motion entry.
 */

"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown } from "lucide-react"
import { UserProfile } from "@/lib/types"
import { COUNTRIES, ATTENDANCE_OPTIONS, JOB_TYPES, INTERESTS } from "@/lib/constants"

/** Zod validation schema — each field maps to one onboarding step */
const formSchema = z.object({
    name: z.string().min(2, {
        message: "Name must be at least 2 characters.",
    }),
    jobType: z.string().min(1, {
        message: "Please select a job type.",
    }),
    location: z.string().min(1, {
        message: "Please select your location.",
    }),
    attendanceDays: z.array(z.string()).refine((value) => value.length > 0, {
        message: "Please select your attendance days.",
    }),
    interests: z.array(z.string()).refine((value) => value.length > 0, {
        message: "Please select at least one interest.",
    }),
})

interface OnboardingFormProps {
    /** Called with the completed user profile when all steps are validated */
    onSubmit: (data: UserProfile) => void
    /** Pre-fills the form when the user returns to edit their profile */
    defaultValues?: UserProfile
}

export function OnboardingForm({ onSubmit, defaultValues }: OnboardingFormProps) {
    const [step, setStep] = useState(1)
    const [openInterests, setOpenInterests] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: defaultValues?.name || "",
            jobType: defaultValues?.jobType || "",
            location: defaultValues?.location || "",
            attendanceDays: defaultValues?.attendanceDays || [],
            interests: defaultValues?.interests || [],
        },
    })

    const totalSteps = 5

    // Validate only the current step's fields, then advance or submit
    const nextStep = async () => {
        let fieldsToValidate: (keyof z.infer<typeof formSchema>)[] = []

        switch (step) {
            case 1:
                fieldsToValidate = ["name"]
                break
            case 2:
                fieldsToValidate = ["jobType"]
                break
            case 3:
                fieldsToValidate = ["location"]
                break
            case 4:
                fieldsToValidate = ["attendanceDays"]
                break
            case 5:
                fieldsToValidate = ["interests"]
                break
        }

        const isValid = await form.trigger(fieldsToValidate)
        if (isValid) {
            if (step < totalSteps) {
                setStep(step + 1)
            } else {
                form.handleSubmit(handleSubmit)()
            }
        }
    }

    const prevStep = () => {
        if (step > 1) {
            setStep(step - 1)
        }
    }

    function handleSubmit(values: z.infer<typeof formSchema>) {
        onSubmit(values as UserProfile)
    }

    // Watch all fields reactively to enable/disable the Continue button
    const values = form.watch()

    /** Check if the current step has valid input (used to disable the Continue button) */
    const isStepValid = () => {
        switch (step) {
            case 1:
                return values.name && values.name.length >= 2
            case 2:
                return values.jobType && values.jobType.length > 0
            case 3:
                return values.location && values.location.length > 0
            case 4:
                return values.attendanceDays && values.attendanceDays.length > 0
            case 5:
                return values.interests && values.interests.length > 0
            default:
                return false
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative w-full max-w-2xl mx-auto"
        >
            {/* Geometric ambient decorations */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl -z-10" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl -z-10" />

            <Card className="glass-card w-full overflow-hidden rounded-2xl border-0">
                {/* Cyan progress bar at top */}
                <div
                    className="h-0.5 bg-gradient-to-r from-cyan-500 via-cyan-400/60 to-cyan-400/10 transition-all duration-500"
                    style={{ width: `${(step / totalSteps) * 100}%` }}
                />

                <CardHeader className="space-y-4 pt-6">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                            Onboarding
                        </span>
                        {/* Step indicator dots */}
                        <div className="flex gap-1.5">
                            {Array.from({ length: totalSteps }).map((_, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "h-1.5 rounded-full transition-all duration-300",
                                        i + 1 === step
                                            ? "w-6 bg-cyan-500 dark:bg-cyan-400"
                                            : i + 1 < step
                                                ? "w-3 bg-cyan-500/50 dark:bg-cyan-400/50"
                                                : "w-3 bg-black/20 dark:bg-slate-700/60"
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold font-serif tracking-tight text-foreground">
                        {step === 1 && "Start your journey."}
                        {step === 2 && "What is your role?"}
                        {step === 3 && "Where are you from?"}
                        {step === 4 && "Select your availability."}
                        {step === 5 && "Choose your interests."}
                    </CardTitle>
                    <CardDescription className="text-lg text-muted-foreground font-sans">
                        {step === 1 && "Let's personalize your XyzCon 2026 experience."}
                        {step === 2 && "We'll tailor the conversation to your background."}
                        {step === 3 && "To help provide location-relevant context."}
                        {step === 4 && "If we schedule a follow-up, when works?"}
                        {step === 5 && "Select topics you'd like to discuss."}
                    </CardDescription>
                </CardHeader>

                <CardContent className="pt-6 min-h-[400px]">
                    <Form {...form}>
                        <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
                            {step === 1 && (
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input
                                                    placeholder="Enter your full name"
                                                    {...field}
                                                    className="text-lg py-8 px-6 bg-input/50 border-border focus-visible:ring-4 focus-visible:ring-cyan-500 transition-all"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            nextStep();
                                                        }
                                                    }}
                                                    autoFocus
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {step === 2 && (
                                <FormField
                                    control={form.control}
                                    name="jobType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="py-8 px-6 text-lg bg-input/50 border-border focus:ring-4 focus:ring-cyan-500">
                                                        <SelectValue placeholder="Select your role" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="bg-popover border-border">
                                                    {JOB_TYPES.map((job) => (
                                                        <SelectItem key={job} value={job} className="text-lg py-3 focus:bg-cyan-400/20 focus:text-foreground cursor-pointer">
                                                            {job}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {step === 3 && (
                                <FormField
                                    control={form.control}
                                    name="location"
                                    render={({ field }) => (
                                        <FormItem>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="py-8 px-6 text-lg bg-input/50 border-border focus:ring-4 focus:ring-cyan-500">
                                                        <SelectValue placeholder="Select your location" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="bg-popover border-border max-h-[300px]">
                                                    {COUNTRIES.map((country) => (
                                                        <SelectItem key={country} value={country} className="text-lg py-3 focus:bg-cyan-400/20 focus:text-foreground cursor-pointer">
                                                            {country}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {step === 4 && (
                                <FormField
                                    control={form.control}
                                    name="attendanceDays"
                                    render={() => (
                                        <FormItem>
                                            <div className="flex flex-col sm:flex-row gap-4 w-full">
                                                {ATTENDANCE_OPTIONS.map((option) => (
                                                    <FormField
                                                        key={option.label}
                                                        control={form.control}
                                                        name="attendanceDays"
                                                        render={({ field }) => {
                                                            return (
                                                                <FormItem className="flex-1 space-y-0">
                                                                    <FormControl>
                                                                        <div
                                                                            onClick={() => field.onChange(option.value)}
                                                                            className={cn(
                                                                                "cursor-pointer rounded-xl border-2 p-4 text-center transition-all h-full flex items-center justify-center hover:bg-muted/50 min-h-[48px] focus-visible:ring-4 focus-visible:ring-cyan-500",
                                                                                JSON.stringify(field.value) === JSON.stringify(option.value)
                                                                                    ? "border-cyan-600 bg-cyan-50 text-cyan-700 dark:border-cyan-400 dark:bg-cyan-400/10 dark:text-cyan-400 font-bold shadow-lg shadow-cyan-400/10"
                                                                                    : "border-input bg-card text-muted-foreground hover:border-cyan-500/40 dark:hover:border-cyan-400/40"
                                                                            )}
                                                                        >
                                                                            <span className="text-lg">{option.label}</span>
                                                                        </div>
                                                                    </FormControl>
                                                                </FormItem>
                                                            )
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {step === 5 && (
                                <FormField
                                    control={form.control}
                                    name="interests"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <Popover open={openInterests} onOpenChange={setOpenInterests}>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            aria-expanded={openInterests}
                                                            className={cn(
                                                                "w-full justify-between py-8 px-6 text-lg bg-input/50 border-border hover:bg-input/70 hover:text-foreground focus-visible:ring-4 focus-visible:ring-cyan-500 min-h-[48px]",
                                                                !field.value || field.value.length === 0 && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value && field.value.length > 0
                                                                ? `${field.value.length} selected`
                                                                : "Select interests..."}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover border-border">
                                                    <Command className="bg-transparent">
                                                        <CommandInput placeholder="Search interests..." className="h-12 text-base" />
                                                        <CommandList>
                                                            <CommandEmpty>No interest found.</CommandEmpty>
                                                            <CommandGroup>
                                                                {INTERESTS.map((tag) => (
                                                                    <CommandItem
                                                                        value={tag}
                                                                        key={tag}
                                                                        onSelect={() => {
                                                                            const current = field.value || []
                                                                            const updated = current.includes(tag)
                                                                                ? current.filter((value) => value !== tag)
                                                                                : [...current, tag]
                                                                            field.onChange(updated)
                                                                        }}
                                                                        className="cursor-pointer text-base py-3 aria-selected:bg-cyan-100 dark:aria-selected:bg-cyan-400/20 aria-selected:text-foreground"
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-3 h-5 w-5 text-cyan-700 dark:text-cyan-400",
                                                                                field.value?.includes(tag)
                                                                                    ? "opacity-100"
                                                                                    : "opacity-0"
                                                                            )}
                                                                        />
                                                                        {tag}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>

                                            {/* Selected Tags Display */}
                                            {field.value && field.value.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-4 animate-in fade-in slide-in-from-top-2">
                                                    {field.value.map((tag) => (
                                                        <div
                                                            key={tag}
                                                            className="bg-cyan-50 text-cyan-700 border border-cyan-600/25 dark:bg-cyan-400/10 dark:text-cyan-400 dark:border-cyan-400/25 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"
                                                        >
                                                            {tag}
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const updated = field.value.filter((t) => t !== tag);
                                                                    field.onChange(updated);
                                                                }}
                                                                className="hover:text-red-400 transition-colors ml-0.5 focus-visible:outline-none"
                                                                aria-label={`Remove ${tag}`}
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <div className="flex justify-between pt-8">
                                {step > 1 ? (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={prevStep}
                                        className="text-muted-foreground hover:text-foreground focus-visible:ring-4 focus-visible:ring-cyan-500 min-h-[48px]"
                                    >
                                        Back
                                    </Button>
                                ) : (
                                    <div />
                                )}

                                <Button
                                    type="button"
                                    onClick={nextStep}
                                    className={cn(
                                        "px-8 py-6 text-lg font-bold rounded-xl shadow-xl transition-all font-sans min-h-[48px]",
                                        "bg-gradient-to-r from-cyan-500 to-blue-500 hover:brightness-110 hover:scale-105 text-white border-0",
                                        "focus-visible:ring-4 focus-visible:ring-cyan-500"
                                    )}
                                    disabled={!isStepValid()}
                                >
                                    {step === totalSteps ? "Start Experience" : "Continue"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </motion.div>
    )
}
