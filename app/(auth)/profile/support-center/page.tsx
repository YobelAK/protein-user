"use client";

import React, { useState, Suspense } from 'react';
import { Box, Text, TextInput, SimpleGrid, Group, Drawer, Button, Container, Modal, Textarea } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconMenu2 } from '@tabler/icons-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
// import { Sidebar } from '@/components/profile/Sidebar';
import { MessageCircle, Mail, ChevronDown } from 'lucide-react';

export default function Page() {
  const [sidebarOpened, { open, close }] = useDisclosure(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [emailModalOpened, { open: openEmailModal, close: closeEmailModal }] = useDisclosure(false);
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const faqs = [
    { question: 'How do I cancel or reschedule my booking?', answer: 'You can cancel or reschedule your booking by going to My Bookings and selecting the booking you want to modify. Follow the prompts to make changes or cancel.' },
    { question: 'What documents do I need for the speedboat?', answer: 'You will need a valid ID and your booking confirmation. Additional documents may be required depending on your destination.' },
    { question: 'Is travel insurance included?', answer: 'Travel insurance is not automatically included but can be added during the booking process for an additional fee.' },
    { question: 'What is your refund policy?', answer: 'Refunds are available up to 48 hours before your scheduled departure. Cancellations within 48 hours may incur a fee.' },
  ];

  return (
    <Box style={{ width: '100%', minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <Suspense fallback={<Box style={{ height: 64 }} />}>
        <Header />
      </Suspense>
      <Container size="xl" px="md">
        <Box hiddenFrom="md" style={{ marginTop: 12 }}>
          <Button variant="outline" leftSection={<IconMenu2 size={18} />} onClick={open}>
            Open Menu
          </Button>
        </Box>
      </Container>
      <Drawer opened={sidebarOpened} onClose={close} title="Menu" size="md" padding="md" />
      <Box>
        <Container size="xl" py="xl">
          <Box style={{ display: 'flex' }}>
            <Box style={{ flex: 1 }}>
              <Text style={{ fontSize: 30, fontWeight: 700, color: '#284361', marginBottom: 8 }}>Support Center</Text>
              <Text style={{ color: '#6b7280', marginBottom: 32 }}>Need help? We are here for you.</Text>

              {/* <Box style={{ marginBottom: 32 }}>
                <TextInput
                  placeholder="Type your question..."
                  size="md"
                  styles={{ input: { padding: '16px 24px', borderRadius: 8, borderColor: '#e5e7eb', color: '#374151', background: 'white' } }}
                />
              </Box> */}

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={24} style={{ marginBottom: 48 }}>
                <Box
                  style={{
                    backgroundColor: '#284361',
                    color: '#ffffff',
                    borderRadius: 12,
                    padding: 24,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 16,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = '#1f3449';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = '#284361';
                  }}
                  onClick={() => {
                    try {
                      window.open('https://wa.me/6281234567', '_blank', 'noopener,noreferrer');
                    } catch {}
                  }}
                >
                  <Box
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 9999,
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <MessageCircle size={24} color="#ffffff" />
                  </Box>
                  <Box style={{ textAlign: 'left' }}>
                    <Text style={{ fontWeight: 600, fontSize: 18, marginBottom: 4 }}>Live Chat</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>Get instant help from our team</Text>
                  </Box>
                </Box>
                <Box
                  style={{
                    backgroundColor: '#e8f1f5',
                    color: '#284361',
                    borderRadius: 12,
                    padding: 24,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 16,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = '#d5e5ec';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = '#e8f1f5';
                  }}
                  onClick={openEmailModal}
                >
                  <Box style={{ width: 48, height: 48, borderRadius: 9999, backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Mail size={24} color="#284361" />
                  </Box>
                  <Box style={{ textAlign: 'left' }}>
                    <Text style={{ fontWeight: 600, fontSize: 18, marginBottom: 4 }}>Email Support</Text>
                    <Text style={{ color: 'rgba(40,67,97,0.7)', fontSize: 14 }}>We will respond within 24 hours</Text>
                  </Box>
                </Box>
              </SimpleGrid>

              <Box>
                <Text style={{ fontSize: 24, fontWeight: 700, color: '#284361', marginBottom: 24 }}>Frequently Asked Questions</Text>
                <Box style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {faqs.map((faq, index) => (
                    <Box key={index} style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8 }}>
                      <Group onClick={() => setOpenFaq(openFaq === index ? null : index)} style={{ width: '100%', padding: '16px 24px', justifyContent: 'space-between', cursor: 'pointer' }}>
                        <Text style={{ fontWeight: 500, color: '#284361' }}>{faq.question}</Text>
                        <ChevronDown size={20} color="#284361" style={{ transform: openFaq === index ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                      </Group>
                      {openFaq === index && (
                        <Box style={{ padding: '16px 24px', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
                          <Text style={{ color: '#6b7280' }}>{faq.answer}</Text>
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>
      <Footer />
      <Modal opened={emailModalOpened} onClose={closeEmailModal} title="Email Support">
        <Box style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {message && <Text c="green" size="sm">{message}</Text>}
          {error && <Text c="red" size="sm">{error}</Text>}
          <TextInput
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            type="email"
            required
          />
          <Textarea
            placeholder="Describe your request"
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            minRows={3}
          />
          <Group justify="flex-end">
            <Button
              onClick={async () => {
                setLoading(true);
                setMessage(null);
                setError(null);
                try {
                  const res = await fetch('/api/newsletter', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, description }),
                  });
                  if (res.ok) {
                    setMessage('Request sent');
                    setEmail('');
                    setDescription('');
                  } else {
                    const data = await res.json().catch(() => ({}));
                    setError(typeof data?.error === 'string' ? data.error : 'Terjadi kesalahan');
                  }
                } catch (e) {
                  setError('Terjadi kesalahan');
                } finally {
                  setLoading(false);
                }
              }}
              loading={loading}
            >
              Send
            </Button>
          </Group>
        </Box>
      </Modal>
    </Box>
  );
}
