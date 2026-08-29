import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Help() {
  return (
    <div className="pb-20">
      <div className="trx-container pt-10">
        <div className="trx-overline text-muted-foreground">Pusat Bantuan</div>
        <h1 className="mt-2 text-3xl md:text-5xl font-black tracking-tighter">
          Bagaimana kami bisa membantu?
        </h1>
        <p className="mt-3 text-muted-foreground max-w-xl">
          Panduan booking, konfirmasi pembayaran, dan pertanyaan umum tentang
          trip TREXIO.
        </p>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "Cara Booking", desc: "Langkah-langkah lengkap dari pencarian sampai konfirmasi." },
            { title: "Konfirmasi Pembayaran", desc: "Panduan upload bukti transfer dan status pembayaran." },
            { title: "Kebijakan Pembatalan", desc: "Syarat & ketentuan pembatalan / refund." },
          ].map((c) => (
            <div key={c.title} className="bg-white border border-border rounded-md p-6">
              <div className="font-bold">{c.title}</div>
              <p className="mt-2 text-sm text-muted-foreground">{c.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 max-w-2xl">
          <h2 className="text-2xl font-black tracking-tighter">FAQ</h2>
          <Accordion type="single" collapsible className="mt-4">
            <AccordionItem value="a">
              <AccordionTrigger>Bagaimana cara memesan trip?</AccordionTrigger>
              <AccordionContent>
                Pilih trip, klik "Booking Sekarang", pilih tanggal, isi data peserta,
                lanjut ke checkout. Setelah pembayaran, upload bukti transfer.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="b">
              <AccordionTrigger>Berapa lama verifikasi pembayaran?</AccordionTrigger>
              <AccordionContent>
                Verifikasi dilakukan dalam 1×24 jam. Status akan diperbarui di halaman
                Reservasi Saya.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="c">
              <AccordionTrigger>Apakah bisa refund?</AccordionTrigger>
              <AccordionContent>
                Refund mengikuti kebijakan pembatalan trip. Silakan hubungi CS untuk
                bantuan.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="d">
              <AccordionTrigger>Bank rekening TREXIO?</AccordionTrigger>
              <AccordionContent>
                BCA 1234567890 a.n PT TREXIO INDONESIA. Nomor rekening juga tersedia
                di halaman konfirmasi pembayaran setelah membuat booking.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
