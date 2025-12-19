'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Box, Container, SimpleGrid, Title, Text, Group, ActionIcon, Stack, Divider, Modal, ScrollArea } from '@mantine/core'
import { IconBrandFacebook, IconBrandTwitter, IconBrandInstagram, IconBrandYoutube, IconMail, IconPhone, IconMapPin } from '@tabler/icons-react'
import '../../styles/footer.css'

export function Footer() {
  const [modalOpened, setModalOpened] = useState(false)
  const [modalType, setModalType] = useState<'terms' | 'privacy' | null>(null)
  const openModal = (type: 'terms' | 'privacy') => { setModalType(type); setModalOpened(true) }
  const closeModal = () => { setModalOpened(false); setModalType(null) }

  return (
    <Box component="footer" style={{ backgroundColor: '#284361', color: 'white' }}>
      <Container size="xl" py="xl">
        <Modal
          opened={modalOpened}
          onClose={closeModal}
          title={modalType === 'terms' ? 'Terms of Service' : modalType === 'privacy' ? 'Privacy Policy' : ''}
          size="lg"
          centered
          overlayProps={{ opacity: 0.5 }}
        >
          <ScrollArea style={{ height: 500 }}>
            {modalType === 'terms' ? (
              <Stack gap="md">
                <Title order={3}>Syarat & Ketentuan BestTripGuide</Title>
                <Text>Selamat datang di BestTripGuide, penyedia layanan pemesanan fastboat untuk perjalanan antar pulau. Dengan menggunakan layanan kami, Anda menyetujui Syarat & Ketentuan berikut.</Text>
                <Title order={4}>1. Definisi</Title>
                <Text>"Kami" mengacu pada BestTripGuide. "Pengguna" adalah pihak yang melakukan pemesanan melalui platform kami. "Operator" adalah penyedia layanan fastboat yang bekerja sama dengan kami.</Text>
                <Title order={4}>2. Pemesanan & Pembayaran</Title>
                <Text>Pemesanan dianggap berhasil setelah pembayaran terkonfirmasi. Metode pembayaran yang tersedia dapat berupa kartu, virtual account, atau QRIS. Harga dapat berubah sewaktu-waktu mengikuti kebijakan operator.</Text>
                <Title order={4}>3. Batas Waktu Pembayaran</Title>
                <Text>Setiap pemesanan memiliki batas waktu pembayaran 15 menit sejak pemesanan dibuat. Jika pembayaran tidak diterima dalam batas waktu, pemesanan dapat otomatis dibatalkan.</Text>
                <Title order={4}>4. Perubahan Jadwal & Pembatalan</Title>
                <Text>Operator dapat melakukan perubahan jadwal karena kondisi operasional atau cuaca. Kami akan berupaya memberi notifikasi. Pembatalan mengikuti kebijakan operator dan dapat dikenakan biaya.</Text>
                <Title order={4}>5. Kelayakan Penumpang</Title>
                <Text>Penumpang wajib memenuhi persyaratan keselamatan dan membawa identitas yang sah. Anak-anak harus didampingi sesuai aturan operator.</Text>
                <Title order={4}>6. Tanggung Jawab</Title>
                <Text>Kami bertindak sebagai platform pemesanan. Tanggung jawab operasional perjalanan berada pada operator. Kami tidak bertanggung jawab atas kehilangan atau kerusakan barang pribadi.</Text>
                <Title order={4}>7. Kebijakan Refund</Title>
                <Text>Refund tunduk pada kebijakan operator. Permohonan refund harus diajukan melalui halaman bantuan dan akan diproses sesuai ketentuan yang berlaku.</Text>
                <Title order={4}>8. Privasi</Title>
                <Text>Data Anda dikelola sesuai Privacy Policy BestTripGuide. Dengan memesan, Anda menyetujui pengolahan data untuk keperluan layanan.</Text>
                <Title order={4}>9. Hukum yang Berlaku</Title>
                <Text>Syarat & Ketentuan ini diatur oleh hukum Republik Indonesia.</Text>
              </Stack>
            ) : modalType === 'privacy' ? (
              <Stack gap="md">
                <Title order={3}>Kebijakan Privasi BestTripGuide</Title>
                <Text>Kebijakan ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi Anda saat menggunakan layanan BestTripGuide.</Text>
                <Title order={4}>1. Data yang Dikumpulkan</Title>
                <Text>Kami mengumpulkan nama, email, nomor telepon, detail pemesanan, serta data teknis seperti alamat IP dan informasi perangkat untuk peningkatan layanan.</Text>
                <Title order={4}>2. Penggunaan Data</Title>
                <Text>Data digunakan untuk memproses pemesanan, dukungan pelanggan, komunikasi terkait layanan, peningkatan fitur, serta kepatuhan terhadap regulasi.</Text>
                <Title order={4}>3. Dasar Pemrosesan</Title>
                <Text>Kami memproses data berdasarkan persetujuan, pelaksanaan kontrak, dan kepentingan yang sah untuk operasional platform.</Text>
                <Title order={4}>4. Berbagi Data</Title>
                <Text>Data dapat dibagikan dengan operator fastboat dan mitra pembayaran untuk menyelesaikan transaksi. Kami tidak menjual data pribadi kepada pihak ketiga.</Text>
                <Title order={4}>5. Retensi</Title>
                <Text>Data disimpan selama diperlukan untuk tujuan layanan dan sesuai ketentuan hukum yang berlaku.</Text>
                <Title order={4}>6. Keamanan</Title>
                <Text>Kami menerapkan langkah-langkah keamanan yang wajar untuk melindungi data dari akses tidak sah.</Text>
                <Title order={4}>7. Hak Pengguna</Title>
                <Text>Anda berhak mengakses, memperbarui, atau menghapus data tertentu sesuai regulasi. Hubungi kami untuk permintaan terkait privasi.</Text>
                <Title order={4}>8. Cookies</Title>
                <Text>Kami menggunakan cookies untuk fungsi dasar, analitik, dan meningkatkan pengalaman pengguna.</Text>
                <Title order={4}>9. Kontak</Title>
                <Text>Untuk pertanyaan privasi, silakan hubungi info@name.com atau melalui halaman bantuan.</Text>
              </Stack>
            ) : null}
          </ScrollArea>
        </Modal>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="xl" mb="xl">
          {/* About */}
          <Stack gap="md">
            <Title order={3} size="lg" c="white">Best Trip Guide</Title>
            <Text size="sm" c="gray.3" mb="md">
              Your trusted partner for island adventures in Bali and beyond. We
              provide safe, reliable, and unforgettable experiences.
            </Text>
            {/* <Group gap="sm">
              <ActionIcon 
                variant="subtle" 
                color="white" 
                size="lg" 
                radius="xl"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
                }}
              >
                <IconBrandFacebook size={16} />
              </ActionIcon>
              <ActionIcon 
                variant="subtle" 
                color="white" 
                size="lg" 
                radius="xl"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
                }}
              >
                <IconBrandInstagram size={16} />
              </ActionIcon>
              <ActionIcon 
                variant="subtle" 
                color="white" 
                size="lg" 
                radius="xl"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
                }}
              >
                <IconBrandTwitter size={16} />
              </ActionIcon>
              <ActionIcon 
                variant="subtle" 
                color="white" 
                size="lg" 
                radius="xl"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
                }}
              >
                <IconBrandYoutube size={16} />
              </ActionIcon> */}
            {/* </Group> */}
          </Stack>

          {/* Our Products */}
          <Stack gap="md">
            <Title order={3} size="lg" c="white">Our Products</Title>
            <Stack gap="xs">
              <Link 
                href="/fastboat" 
                style={{ 
                  textDecoration: 'none',
                  color: '#d1d5db',
                  fontSize: '14px',
                  transition: 'color 0.2s'
                }}
                className="footer-link"
              >
                Fastboat Services
              </Link>
              {/* <Link 
                href="/tour" 
                style={{ 
                  textDecoration: 'none',
                  color: '#d1d5db',
                  fontSize: '14px',
                  transition: 'color 0.2s'
                }}
                className="footer-link"
              >
                Tour Packages
              </Link>
              <Link 
                href="/watersport" 
                style={{ 
                  textDecoration: 'none',
                  color: '#d1d5db',
                  fontSize: '14px',
                  transition: 'color 0.2s'
                }}
                className="footer-link"
              >
                Watersport Activities
              </Link>
              <Link 
                href="/beachclub" 
                style={{ 
                  textDecoration: 'none',
                  color: '#d1d5db',
                  fontSize: '14px',
                  transition: 'color 0.2s'
                }}
                className="footer-link"
              >
                Beach Club Access
              </Link>
              <Link 
                href="/promo" 
                style={{ 
                  textDecoration: 'none',
                  color: '#d1d5db',
                  fontSize: '14px',
                  transition: 'color 0.2s'
                }}
                className="footer-link"
              >
                Special Offers
              </Link> */}
            </Stack>
          </Stack>

          {/* Support */}
          <Stack gap="md">
            <Title order={3} size="lg" c="white">Support</Title>
            <Stack gap="xs">
              <Link 
                href="/profile/support-center" 
                style={{ 
                  textDecoration: 'none',
                  color: '#d1d5db',
                  fontSize: '14px',
                  transition: 'color 0.2s'
                }}
                className="footer-link"
              >
                Help Center
              </Link>
              <Link 
                href="/profile/support-center" 
                style={{ 
                  textDecoration: 'none',
                  color: '#d1d5db',
                  fontSize: '14px',
                  transition: 'color 0.2s'
                }}
                className="footer-link"
              >
                Contact Us
              </Link>
              <Link 
                href="/profile/support-center" 
                style={{ 
                  textDecoration: 'none',
                  color: '#d1d5db',
                  fontSize: '14px',
                  transition: 'color 0.2s'
                }}
                className="footer-link"
              >
                FAQ
              </Link>
              <Link 
                href="/terms" 
                style={{ 
                  textDecoration: 'none',
                  color: '#d1d5db',
                  fontSize: '14px',
                  transition: 'color 0.2s'
                }}
                className="footer-link"
                onClick={(e) => { e.preventDefault(); openModal('terms') }}
              >
                Terms of Service
              </Link>
              <Link 
                href="/privacy" 
                style={{ 
                  textDecoration: 'none',
                  color: '#d1d5db',
                  fontSize: '14px',
                  transition: 'color 0.2s'
                }}
                className="footer-link"
                onClick={(e) => { e.preventDefault(); openModal('privacy') }}
              >
                Privacy Policy
              </Link>
            </Stack>
          </Stack>

          {/* Contact */}
          <Stack gap="md">
            <Title order={3} size="lg" c="white">Contact</Title>
            <Stack gap="sm">
              <Group gap="sm" align="flex-start">
                <IconMapPin size={20} style={{ marginTop: 2, flexShrink: 0 }} />
                <Text size="sm" c="gray.3">
                  Jl. Danau Tamblingan No.123, Sanur, Bali 80228
                </Text>
              </Group>
              <Group gap="sm" align="center">
                <IconPhone size={20} style={{ flexShrink: 0 }} />
                <Text size="sm" c="gray.3">
                  +62 361 123 4567
                </Text>
              </Group>
              <Group gap="sm" align="center">
                <IconMail size={20} style={{ flexShrink: 0 }} />
                <Text size="sm" c="gray.3">
                  info@name.com
                </Text>
              </Group>
            </Stack>
          </Stack>
        </SimpleGrid>
        
        <Divider color="rgba(255, 255, 255, 0.1)" />
        
        <Box pt="xl" ta="center">
          <Text size="sm" c="gray.3">
            &copy; 2024 Best Trip Guide. All rights reserved.
          </Text>
        </Box>
      </Container>
    </Box>
  );
}
