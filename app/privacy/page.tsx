 'use client';
 
 import React from 'react';
 import { Container, Stack, Title, Text } from '@mantine/core';
 import { PublicLayout } from '@/components/layout/public-layout';
 
 export default function PrivacyPage() {
   return (
     <PublicLayout>
       <Container size="xl" py="xl">
         <Stack gap="md">
           <Title order={3}>Kebijakan Privasi BestTripGuide</Title>
           <Text>
             Kebijakan ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi Anda saat
             menggunakan layanan BestTripGuide.
           </Text>
 
           <Title order={4}>1. Data yang Dikumpulkan</Title>
           <Text>
             Kami mengumpulkan nama, email, nomor telepon, detail pemesanan, serta data teknis seperti alamat IP dan
             informasi perangkat untuk peningkatan layanan.
           </Text>
 
           <Title order={4}>2. Penggunaan Data</Title>
           <Text>
             Data digunakan untuk memproses pemesanan, dukungan pelanggan, komunikasi terkait layanan, peningkatan
             fitur, serta kepatuhan terhadap regulasi.
           </Text>
 
           <Title order={4}>3. Dasar Pemrosesan</Title>
           <Text>
             Kami memproses data berdasarkan persetujuan, pelaksanaan kontrak, dan kepentingan yang sah untuk operasional
             platform.
           </Text>
 
           <Title order={4}>4. Berbagi Data</Title>
           <Text>
             Data dapat dibagikan dengan operator fastboat dan mitra pembayaran untuk menyelesaikan transaksi. Kami tidak
             menjual data pribadi kepada pihak ketiga.
           </Text>
 
           <Title order={4}>5. Retensi</Title>
           <Text>
             Data disimpan selama diperlukan untuk tujuan layanan dan sesuai ketentuan hukum yang berlaku.
           </Text>
 
           <Title order={4}>6. Keamanan</Title>
           <Text>
             Kami menerapkan langkah-langkah keamanan yang wajar untuk melindungi data dari akses tidak sah.
           </Text>
 
           <Title order={4}>7. Hak Pengguna</Title>
           <Text>
             Anda berhak mengakses, memperbarui, atau menghapus data tertentu sesuai regulasi. Hubungi kami untuk
             permintaan terkait privasi.
           </Text>
 
           <Title order={4}>8. Cookies</Title>
           <Text>Kami menggunakan cookies untuk fungsi dasar, analitik, dan meningkatkan pengalaman pengguna.</Text>
 
           <Title order={4}>9. Kontak</Title>
           <Text>Untuk pertanyaan privasi, silakan hubungi info@name.com atau melalui halaman bantuan.</Text>
         </Stack>
       </Container>
     </PublicLayout>
   );
 }
