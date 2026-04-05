
CREATE TABLE public.private_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_private_messages_sender ON public.private_messages(sender_id);
CREATE INDEX idx_private_messages_receiver ON public.private_messages(receiver_id);
CREATE INDEX idx_private_messages_conversation ON public.private_messages(sender_id, receiver_id);

-- Users can view messages they sent or received
CREATE POLICY "Users can view own messages"
  ON public.private_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can send messages as themselves
CREATE POLICY "Users can send messages"
  ON public.private_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Recipients can mark messages as read
CREATE POLICY "Recipients can mark as read"
  ON public.private_messages FOR UPDATE
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- Admins full access
CREATE POLICY "Admins can manage all messages"
  ON public.private_messages FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.private_messages;
