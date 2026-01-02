import { relations } from "drizzle-orm/relations";
import { teams, analyticsEvents, users, chatSessions, chatMessages, teamFiles, teamMembers } from "./schema";

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

export const teamsRelations = relations(teams, ({many}) => ({
	analyticsEvents: many(analyticsEvents),
	chatSessions: many(chatSessions),
	teamFiles: many(teamFiles),
	teamMembers: many(teamMembers),
}));

export const usersRelations = relations(users, ({many}) => ({
	analyticsEvents: many(analyticsEvents),
	chatSessions: many(chatSessions),
	teamMembers: many(teamMembers),
}));

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

export const chatMessagesRelations = relations(chatMessages, ({one}) => ({
	chatSession: one(chatSessions, {
		fields: [chatMessages.chatSessionId],
		references: [chatSessions.id]
	}),
}));

export const teamFilesRelations = relations(teamFiles, ({one}) => ({
	team: one(teams, {
		fields: [teamFiles.teamId],
		references: [teams.id]
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
