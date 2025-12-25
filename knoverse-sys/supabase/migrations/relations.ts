import { relations } from "drizzle-orm/relations";
import { teams, chatSessions, users, chatMessages, analyticsEvents, teamMembers } from "./schema";

export const chatSessionsRelations = relations(chatSessions, ({one, many}) => ({
	team: one(teams, {
		fields: [chatSessions.teamId],
		references: [teams.id]
	}),
	user: one(users, {
		fields: [chatSessions.userId],
		references: [users.id]
	}),
	chatMessages: many(chatMessages),
}));

export const teamsRelations = relations(teams, ({many}) => ({
	chatSessions: many(chatSessions),
	analyticsEvents: many(analyticsEvents),
	teamMembers: many(teamMembers),
}));

export const usersRelations = relations(users, ({many}) => ({
	chatSessions: many(chatSessions),
	chatMessages: many(chatMessages),
	analyticsEvents: many(analyticsEvents),
	teamMembers: many(teamMembers),
}));

export const chatMessagesRelations = relations(chatMessages, ({one}) => ({
	chatSession: one(chatSessions, {
		fields: [chatMessages.chatSessionId],
		references: [chatSessions.id]
	}),
	user: one(users, {
		fields: [chatMessages.senderId],
		references: [users.id]
	}),
}));

export const analyticsEventsRelations = relations(analyticsEvents, ({one}) => ({
	team: one(teams, {
		fields: [analyticsEvents.teamId],
		references: [teams.id]
	}),
	user: one(users, {
		fields: [analyticsEvents.userId],
		references: [users.id]
	}),
}));

export const teamMembersRelations = relations(teamMembers, ({one}) => ({
	team: one(teams, {
		fields: [teamMembers.teamId],
		references: [teams.id]
	}),
	user: one(users, {
		fields: [teamMembers.userId],
		references: [users.id]
	}),
}));