'use client'

import { FC, FormEvent, Fragment, useEffect, useId, useMemo, useRef, useState } from "react"
import timeZoneList from "timezones.json"

const defaultDate = new Date(1680480000000)

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

const Page: FC<P> = (props) => {
    const [date, setDate] = useState<Date | null>(safeDateNumber(props.searchParams.date_epoch_milliseconds) ?? safeDate(props.searchParams.date) ?? defaultDate)
    const [timezone, setTimezone] = useState<string | null>(safeTimezone(props.searchParams.timezone) ?? "Etc/GMT")
    const [locale, setLocale] = useState<string | null>(safeLocale(props.searchParams.locale) ?? "en-US")

    const formRef = useRef<HTMLFormElement>()
    const timeZoneOptionsId = useId()

    useEffect(() => {
        if (formRef.current) {
            const form = formRef.current

            const handler = (event: Event) => {
                if (event.currentTarget instanceof HTMLFormElement) {
                    const dateInput = event.currentTarget.elements.namedItem("date")
                    const timeZoneInput = event.currentTarget.elements.namedItem("timezone")

                    if (dateInput instanceof HTMLInputElement) {
                        const newLocal = new Date(dateInput.valueAsNumber)
                        if (newLocal.getTime()) {
                            setDate(newLocal)
                        }
                    }

                    if (timeZoneInput instanceof HTMLInputElement) {
                        setTimezone(timeZoneInput.value)
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

        <form ref={formRef}>

            <div><h3>UTC Date</h3></div>
            <div>
                <input name="date" type="datetime-local" data-enpassusermodified="yes" defaultValue={date.toISOString().substring(0, 16)} />
            </div>
            <div>
                <input name="timezone" list={timeZoneOptionsId} defaultValue={timezone} />
                <datalist id={timeZoneOptionsId}>{timeZoneOptions}</datalist>
            </div>

        </form>

        <div>
            <p>{date.toLocaleString(locale, { timeStyle: "full", dateStyle: "full", hourCycle: "h23", timeZone: timezone })}</p>
            <p><strong>Epoch Milliseconds</strong>: {date.getTime()}</p>
        </div>
    </>
}

export default Page