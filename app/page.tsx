'use client'

import { FC, FormEvent, Fragment, PropsWithChildren, createContext, useEffect, useId, useMemo, useRef, useState } from "react"
import timeZoneList from "timezones.json"

const defaultDate = new Date(1672531200000)

interface P {
    searchParams?: {
        date?: string,
        date_epoch_milliseconds?: string,
        locale?: string,
        timezone?: string,
    }
}

const safeLocale = (locale: string) => {
    try {
        new Intl.Locale(locale)
        return locale
    } catch {
        return null
    }
}

const safeTimezone = (timezone: string) => {
    try {
        defaultDate.toLocaleString("en-US", { timeZone: timezone })
        return timezone
    } catch {
        return null
    }
}

const safeDate = (date: string) => {
    const newLocal = Date.parse(date)
    return !Number.isNaN(newLocal) ? new Date(newLocal) : null
}

const safeDateNumber = (date: string) => {
    const newLocal = new Date(Number(date))
    return !Number.isNaN(newLocal.getDate()) ? newLocal : null
}

const LabelCopy: FC<{ value?: string, children: string }> = ({ value, children }) => {
    const onclick = () => {
        navigator.clipboard.writeText(value ?? children)
        notifications.push({ id: `${u()}`, msg: "Copied 📋", ttl: 2_500 })
    }

    return <span onClick={onclick}>{children}</span>
}

interface NotificationPayload {
    id: string
    msg: string
    ttl?: number
}

const u = () => u.m++
u.m = 0

const notifications = new class {
    private messages: NotificationPayload[] = []
    private subs: (() => void)[] = []

    private propague() { this.subs.forEach(sub => sub()) }

    push(payload: NotificationPayload) {
        this.messages = [...this.messages, payload]
        this.propague()
        if (payload.ttl) {
            setTimeout(() => {
                this.messages = this.messages.filter(p => p !== payload)
                this.propague()
            }, payload.ttl)
        }
    }

    subscribe(cb: () => void) {
        this.subs = [...this.subs, cb]
        return () => {
            this.subs = this.subs.filter(f => f !== cb)
        }
    }

    useNotifications() {
        const [messages, setMessages] = useState<NotificationPayload[]>(this.messages)

        useEffect(() => notifications.subscribe(() => {
            setMessages(this.messages)
        }))

        return messages
    }
}

const NotificationBox: FC<PropsWithChildren> = ({ children }) => {
    const messages = notifications.useNotifications()

    console.log(messages)

    return <>
        {children}
        <div className="absolute bottom-0 right-0 p-2 flex gap-2 flex-col items-end">
            {messages.map(p => <span key={p.id} className="max-w-xs border shadow bg-white p-2 rounded">{p.msg}</span>)}
        </div>
    </>
}

const Page: FC<P> = (props) => {
    const [date, setDate] = useState<Date | null>(safeDateNumber(props.searchParams.date_epoch_milliseconds) ?? safeDate(props.searchParams.date) ?? defaultDate)
    const [timezone, setTimezone] = useState<string | null>(safeTimezone(props.searchParams.timezone) ?? "Etc/GMT")
    const [locale, setLocale] = useState<string | null>(safeLocale(props.searchParams.locale) ?? "en-US")

    const toURLString = () => {
        const url = new URL(location.href)
        url.searchParams.set("locale", locale)
        url.searchParams.set("date_epoch_milliseconds", `${date.getTime()}`)
        url.searchParams.set("timezone", timezone)
        return url.toString()
    }

    const formRef = useRef<HTMLFormElement>()
    const timeZoneOptionsId = useId()

    useEffect(() => {
        if (formRef.current) {
            const form = formRef.current

            const handler = (event: Event) => {
                if (event.currentTarget instanceof HTMLFormElement) {
                    const dateInput = event.currentTarget.elements.namedItem("date")
                    const timeZoneInput = event.currentTarget.elements.namedItem("timezone")
                    const localeInput = event.currentTarget.elements.namedItem("locale")

                    if (dateInput instanceof HTMLInputElement) {
                        const newLocal = new Date(dateInput.valueAsNumber)
                        if (newLocal.getTime()) {
                            setDate(newLocal)
                        }
                    }

                    if (timeZoneInput instanceof HTMLInputElement) {
                        const timezoneSafe = safeTimezone(timeZoneInput.value)
                        if (timezoneSafe) {
                            setTimezone(timezoneSafe)
                        }
                    }

                    if (localeInput instanceof HTMLInputElement) {
                        const localeSafe = safeLocale(localeInput.value)
                        if (localeSafe) {
                            setLocale(localeSafe)
                        }
                    }

                }
            }

            form.addEventListener("change", handler)

            return () => {
                form.removeEventListener("change", handler)
            }
        }
    }, [])

    const timeZoneOptions = useMemo(() => <>
        {timeZoneList.map((e, i) => <Fragment key={`${i}`}>
            {e.utc.map(e => <option key={e} value={e}>{e}</option>)}
        </Fragment>)}
    </>, [])

    return <>
        <NotificationBox>
            <div className="container m-auto p-2">
                <form ref={formRef}>

                    <div><h3 className="text-3xl text-center">UTC Date</h3></div>

                    <input name="date" type="datetime-local" defaultValue={date.toISOString().substring(0, 16)} className="p-2 w-full border rounded" />

                    <input name="timezone" list={timeZoneOptionsId} defaultValue={timezone} className="p-2 w-full border rounded" />


                    <datalist id={timeZoneOptionsId}>{timeZoneOptions}</datalist>

                    <input name="locale" placeholder={locale} defaultValue={locale} className="p-2 w-full border rounded" />

                </form>

                <div>
                    <p className="text-4xl text-center"><LabelCopy>{date.toLocaleString(locale, { timeStyle: "full", dateStyle: "full", hourCycle: "h23", timeZone: timezone })}</LabelCopy></p>
                    <p className="text-xl text-center"><strong>Epoch Milliseconds</strong>: <LabelCopy>{date.getTime().toString()}</LabelCopy></p>
                    <p className="text-xl text-center"><strong>ISO</strong>: <LabelCopy>{date.toISOString()}</LabelCopy></p>
                    <p className="text-xl text-center"><strong>UTC</strong>: <LabelCopy>{date.toUTCString()}</LabelCopy></p>
                    <p className="text-xl text-center"><strong>URL Share</strong>: <LabelCopy>{toURLString()}</LabelCopy></p>
                </div>
            </div>
        </NotificationBox>
    </>
}

export default Page