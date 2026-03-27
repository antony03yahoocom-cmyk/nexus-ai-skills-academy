
-- Group status enum
CREATE TYPE public.group_status AS ENUM ('active', 'suspended');

-- Discussion groups table
CREATE TABLE public.discussion_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  status public.group_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.discussion_groups ENABLE ROW LEVEL SECURITY;

-- Members table
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.discussion_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- 'admin' or 'member'
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Messages table
CREATE TABLE public.group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.discussion_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;

-- RLS: discussion_groups
-- Platform admins can do everything
CREATE POLICY "Platform admins manage groups" ON public.discussion_groups FOR ALL TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can view active groups
CREATE POLICY "Users can view active groups" ON public.discussion_groups FOR SELECT TO authenticated
  USING (status = 'active' OR created_by = auth.uid());

-- Authenticated users can create groups
CREATE POLICY "Users can create groups" ON public.discussion_groups FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Group creator can update their own group (name/description)
CREATE POLICY "Creator can update own group" ON public.discussion_groups FOR UPDATE TO authenticated
  USING (auth.uid() = created_by AND status = 'active');

-- RLS: group_members
CREATE POLICY "Platform admins manage members" ON public.group_members FOR ALL TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Members of a group can see other members
CREATE POLICY "Members can view group members" ON public.group_members FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid()));

-- Users can join groups (insert themselves)
CREATE POLICY "Users can join groups" ON public.group_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Group admin can remove members, or user can leave
CREATE POLICY "Group admin or self can delete member" ON public.group_members FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid() AND gm.role = 'admin')
  );

-- RLS: group_messages
CREATE POLICY "Platform admins manage messages" ON public.group_messages FOR ALL TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Members can view messages
CREATE POLICY "Members can view messages" ON public.group_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_messages.group_id AND gm.user_id = auth.uid()));

-- Members can post messages in active groups
CREATE POLICY "Members can post messages" ON public.group_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_messages.group_id AND gm.user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.discussion_groups g WHERE g.id = group_messages.group_id AND g.status = 'active')
  );

-- Message author can delete own message
CREATE POLICY "Author can delete own message" ON public.group_messages FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_messages.group_id AND gm.user_id = auth.uid() AND gm.role = 'admin')
  );
