"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Team = {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
};

type TeamMember = {
  id: string;
  user_id: string;
  role: string;
};

export function TeamSettings() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    loadTeams();
  }, []);

  async function loadTeams() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load teams where user is a member
    const { data: memberTeams } = await supabase
      .from("team_members")
      .select("team_id, teams(id, name, slug, owner_id)")
      .eq("user_id", user.id);

    if (memberTeams) {
      const teamList = memberTeams
        .map((mt: any) => mt.teams)
        .filter(Boolean) as Team[];
      setTeams(teamList);
      if (teamList.length > 0) {
        setSelectedTeam(teamList[0]);
        loadTeamMembers(teamList[0].id);
      }
    }
    setLoading(false);
  }

  async function loadTeamMembers(teamId: string) {
    const { data } = await supabase
      .from("team_members")
      .select("*")
      .eq("team_id", teamId);

    if (data) {
      setMembers(data);
    }
  }

  async function handleCreateTeam() {
    if (!newTeamName.trim()) {
      setMessage("Teamnaam is verplicht");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const slug = newTeamName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    const { data: team, error: teamError } = await supabase
      .from("teams")
      .insert([{ name: newTeamName, slug, owner_id: user.id }])
      .select()
      .single();

    if (teamError) {
      setMessage(`Fout: ${teamError.message}`);
      return;
    }

    // Add owner as team member
    await supabase
      .from("team_members")
      .insert([{ team_id: team.id, user_id: user.id, role: "owner" }]);

    setNewTeamName("");
    setMessage("Team aangemaakt!");
    loadTeams();
  }

  async function handleRemoveMember(memberId: string) {
    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("id", memberId);

    if (error) {
      setMessage(`Fout: ${error.message}`);
      return;
    }

    setMessage("Teamlid verwijderd");
    if (selectedTeam) {
      loadTeamMembers(selectedTeam.id);
    }
  }

  if (loading) {
    return <div className="text-slate-600">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      )}

      {/* Create Team */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Nieuw team</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            placeholder="Teamnaam"
            className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-[#0C447C]"
          />
          <button
            onClick={handleCreateTeam}
            className="rounded-xl bg-[#0C447C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a3863]"
          >
            Aanmaken
          </button>
        </div>
      </div>

      {/* Teams List */}
      {teams.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Mijn teams</h2>
          <div className="space-y-2">
            {teams.map((team) => (
              <button
                key={team.id}
                onClick={() => {
                  setSelectedTeam(team);
                  loadTeamMembers(team.id);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                  selectedTeam?.id === team.id
                    ? "border-[#0C447C] bg-blue-50 text-slate-900 font-semibold"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                {team.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Team Members */}
      {selectedTeam && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Teamleden ({members.length})
          </h2>
          <div className="space-y-2 mb-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between border border-slate-200 rounded-lg p-3"
              >
                <span className="text-sm text-slate-700">
                  {member.role === "owner" ? "👑" : "👤"} {member.role}
                </span>
                {member.role !== "owner" && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Verwijder
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="email"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              placeholder="Email van nieuw teamlid"
              className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-[#0C447C]"
            />
            <button className="rounded-xl bg-[#639922] px-4 py-2 text-sm font-semibold text-white hover:bg-[#537a1a]">
              Uitnodigen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
