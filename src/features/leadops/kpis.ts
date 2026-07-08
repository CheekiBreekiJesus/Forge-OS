import type { LeadOpsCampaign, LeadOpsKpis, LeadOpsLead } from "./types";

export function calculateLeadOpsKpis(
  leads: LeadOpsLead[],
  campaigns: LeadOpsCampaign[]
): LeadOpsKpis {
  const contactedOrBeyond = leads.filter((lead) =>
    ["contacted", "replied", "positive_reply", "bounced"].includes(lead.status)
  );
  const bounced = leads.filter((lead) => lead.status === "bounced");

  return {
    totalLeads: leads.length,
    ready: leads.filter((lead) => lead.status === "ready").length,
    queued: leads.filter((lead) => lead.status === "queued").length,
    contactedSent: leads.filter((lead) => lead.status === "contacted").length,
    replies: leads.filter((lead) => ["replied", "positive_reply"].includes(lead.status)).length,
    positiveReplies: leads.filter((lead) => lead.status === "positive_reply").length,
    bounceRate: calculateBounceRate(bounced.length, contactedOrBeyond.length),
    activeCampaigns: campaigns.filter((campaign) => campaign.status === "active").length
  };
}

export function calculateBounceRate(bouncedCount: number, contactedCount: number): number | null {
  if (contactedCount === 0) {
    return null;
  }

  return Number(((bouncedCount / contactedCount) * 100).toFixed(1));
}

export function getCampaignProgress(campaign: LeadOpsCampaign): number {
  if (campaign.totalCount === 0) {
    return 0;
  }

  return Math.round((campaign.sentCount / campaign.totalCount) * 100);
}
