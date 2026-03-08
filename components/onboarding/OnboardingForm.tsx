"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
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
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
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
    onSubmit: (data: UserProfile) => void
}

export function OnboardingForm({ onSubmit }: OnboardingFormProps) {
    const [step, setStep] = useState(1)
    const [openInterests, setOpenInterests] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            jobType: "",
            location: "",
            attendanceDays: [],
            interests: [],
        },
    })

    const totalSteps = 5

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


    // Watch all fields to determine button state
    const values = form.watch()

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
        <div className="relative w-full max-w-2xl mx-auto mt-20">
            {/* Geometric Decoration */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-2xl -z-10" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-chart-1/20 rounded-full blur-2xl -z-10" />

            <Card className="w-full shadow-2xl border-border bg-card/60 backdrop-blur-xl text-card-foreground overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-primary via-primary/50 to-primary/20" />
                <CardHeader className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Onboarding</span>
                        <div className="flex gap-1">
                            {Array.from({ length: totalSteps }).map((_, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "h-2 w-8 rounded-full transition-all",
                                        i + 1 === step ? "bg-xyz-blue" : i + 1 < step ? "bg-xui-blue" : "bg-muted"
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
                                                    className="text-lg py-8 px-6 bg-input/50 border-input focus:border-xyz-blue focus:ring-xyz-blue transition-all"
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
                                                    <SelectTrigger className="py-8 px-6 text-lg bg-input/50 border-input focus:ring-xyz-blue">
                                                        <SelectValue placeholder="Select your role" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="bg-popover border-border">
                                                    {JOB_TYPES.map((job) => (
                                                        <SelectItem key={job} value={job} className="text-lg py-3 focus:bg-xyz-blue focus:text-white cursor-pointer">
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
                                                    <SelectTrigger className="py-8 px-6 text-lg bg-input/50 border-input focus:ring-xyz-blue">
                                                        <SelectValue placeholder="Select your location" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="bg-popover border-border max-h-[300px]">
                                                    {COUNTRIES.map((country) => (
                                                        <SelectItem key={country} value={country} className="text-lg py-3 focus:bg-xyz-blue focus:text-white cursor-pointer">
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
                                                            const isChecked = field.value?.includes(JSON.stringify(option.value));
                                                            return (
                                                                <FormItem className="flex-1 space-y-0">
                                                                    <FormControl>
                                                                        <div
                                                                            onClick={() => field.onChange(option.value)}
                                                                            className={cn(
                                                                                "cursor-pointer rounded-xl border-2 p-4 text-center transition-all h-full flex items-center justify-center hover:bg-muted/50",
                                                                                JSON.stringify(field.value) === JSON.stringify(option.value)
                                                                                    ? "border-xyz-blue bg-xyz-blue/10 text-xyz-blue font-bold shadow-lg shadow-xyz-blue/20"
                                                                                    : "border-input bg-card text-muted-foreground hover:border-xyz-blue/50"
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
                                                                "w-full justify-between py-8 px-6 text-lg bg-input/50 border-input hover:bg-input/70 hover:text-foreground",
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
                                                                        className="cursor-pointer text-base py-3 aria-selected:bg-xyz-blue/20 aria-selected:text-foreground"
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-3 h-5 w-5 text-xyz-blue",
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
                                                            className="bg-xyz-blue/10 text-xyz-blue border border-xyz-blue/20 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"
                                                        >
                                                            {tag}
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const updated = field.value.filter((t) => t !== tag);
                                                                    field.onChange(updated);
                                                                }}
                                                                className="hover:text-red-400 transition-colors"
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
                                    <Button type="button" variant="ghost" onClick={prevStep} className="text-muted-foreground hover:text-white">
                                        Back
                                    </Button>
                                ) : (
                                    <div />
                                )}

                                <Button
                                    type="button"
                                    onClick={nextStep}
                                    className={cn(
                                        "px-8 py-6 text-lg font-bold rounded-xl shadow-xl transition-all font-sans",
                                        "bg-primary hover:bg-primary/90 text-primary-foreground"
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
        </div>
    )
}
