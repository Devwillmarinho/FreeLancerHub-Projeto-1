"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { HelpCircle, MessageSquare, X } from "lucide-react"
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon"
import Link from "next/link"

export function FloatingHelpButton() {
  const [isOpen, setIsOpen] = useState(false)
  const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5511999999999"

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="flex flex-col items-end gap-3 mb-3">
          <Link
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            className="flex items-center gap-2 bg-white p-3 rounded-full shadow-lg hover:bg-gray-100 transition-all"
          >
            <span className="font-medium text-gray-700">WhatsApp</span>
            <WhatsAppIcon className="h-5 w-5 text-green-500" />
          </Link>
          <Link
            href="/help"
            className="flex items-center gap-2 bg-white p-3 rounded-full shadow-lg hover:bg-gray-100 transition-all"
          >
            <span className="font-medium text-gray-700">Ajuda</span>
            <HelpCircle className="h-6 w-6 text-blue-500" />
          </Link>
        </div>
      )}
      <Button
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full w-14 h-14 flex items-center justify-center shadow-xl hover:scale-110 transition-transform bg-gradient-to-tr from-blue-600 to-purple-600 text-white"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </Button>
    </div>
  )
}
