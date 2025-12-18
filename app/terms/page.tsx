 'use client';
 
 import React from 'react';
 import { Container, Stack, Title, Text } from '@mantine/core';
 import { PublicLayout } from '@/components/layout/public-layout';
 
 export default function TermsPage() {
   return (
     <PublicLayout>
       <Container size="xl" py="xl">
         <Stack gap="md">
           <Title order={3}>Syarat & Ketentuan BestTripGuide</Title>
           <Text>
             Selamat datang di BestTripGuide, penyedia layanan pemesanan fastboat untuk perjalanan antar pulau.
             Dengan menggunakan layanan kami, Anda menyetujui Syarat & Ketentuan berikut.
           </Text>
 
           <Title order={4}>1. Definisi</Title>
           <Text>
             "Kami" mengacu pada BestTripGuide. "Pengguna" adalah pihak yang melakukan pemesanan melalui platform kami.
             "Operator" adalah penyedia layanan fastboat yang bekerja sama dengan kami.
           </Text>
 
           <Title order={4}>2. Pemesanan & Pembayaran</Title>
           <Text>
             Pemesanan dianggap berhasil setelah pembayaran terkonfirmasi. Metode pembayaran yang tersedia dapat berupa
             kartu, virtual account, atau QRIS. Harga dapat berubah sewaktu-waktu mengikuti kebijakan operator.
           </Text>
 
           <Title order={4}>3. Batas Waktu Pembayaran</Title>
           <Text>
             Setiap pemesanan memiliki batas waktu pembayaran 15 menit sejak pemesanan dibuat. Jika pembayaran tidak
             diterima dalam batas waktu, pemesanan dapat otomatis dibatalkan.
           </Text>
 
           <Title order={4}>4. Perubahan Jadwal & Pembatalan</Title>
           <Text>
             Operator dapat melakukan perubahan jadwal karena kondisi operasional atau cuaca. Kami akan berupaya memberi
             notifikasi. Pembatalan mengikuti kebijakan operator dan dapat dikenakan biaya.
           </Text>
 
           <Title order={4}>5. Kelayakan Penumpang</Title>
           <Text>
             Penumpang wajib memenuhi persyaratan keselamatan dan membawa identitas yang sah. Anak-anak harus didampingi
             sesuai aturan operator.
           </Text>
 
           <Title order={4}>6. Tanggung Jawab</Title>
           <Text>
             Kami bertindak sebagai platform pemesanan. Tanggung jawab operasional perjalanan berada pada operator. Kami
             tidak bertanggung jawab atas kehilangan atau kerusakan barang pribadi.
           </Text>
 
           <Title order={4}>7. Kebijakan Refund</Title>
           <Text>
             Refund tunduk pada kebijakan operator. Permohonan refund harus diajukan melalui halaman bantuan dan akan
             diproses sesuai ketentuan yang berlaku.
           </Text>
 
           <Title order={4}>8. Privasi</Title>
           <Text>
             Data Anda dikelola sesuai Privacy Policy BestTripGuide. Dengan memesan, Anda menyetujui pengolahan data
             untuk keperluan layanan.
           </Text>
 
           <Title order={4}>9. Hukum yang Berlaku</Title>
           <Text>Syarat & Ketentuan ini diatur oleh hukum Republik Indonesia.</Text>
         </Stack>
       </Container>
     </PublicLayout>
   );
 }
