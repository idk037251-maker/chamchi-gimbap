/**
 * KakaoCord 원클릭 GitHub 자동 저장소 생성 & 푸시 & Vercel 배포 스크립트
 * 
 * 실행 방법:
 *   node setup_and_push.js
 */

const { execSync } = require("child_process");
const readline = require("readline");
const https = require("https");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

function run(cmd, ignoreError = false) {
  try {
    return execSync(cmd, { stdio: "inherit" });
  } catch (err) {
    if (!ignoreError) throw err;
  }
}

async function createGitHubRepo(token, repoName) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      name: repoName,
      description: "KakaoCord — 카카오톡 × 디스코드 하이브리드 실시간 커뮤니티 채팅 (Next.js + Supabase)",
      private: false,
      has_issues: true,
      has_projects: true,
      has_wiki: false,
    });

    const options = {
      hostname: "api.github.com",
      path: "/user/repos",
      method: "POST",
      headers: {
        "User-Agent": "KakaoCord-AutoDeploy",
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(body);
          if (res.statusCode === 201) {
            resolve(json);
          } else if (res.statusCode === 422) {
            // Already exists
            resolve({ html_url: `https://github.com/${json.owner?.login || ""}/${repoName}`, clone_url: `https://github.com/${json.owner?.login || ""}/${repoName}.git`, alreadyExists: true });
          } else {
            reject(new Error(json.message || `HTTP ${res.statusCode}: ${body}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

async function getAuthenticatedUser(token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.github.com",
      path: "/user",
      method: "GET",
      headers: {
        "User-Agent": "KakaoCord-AutoDeploy",
        Authorization: `token ${token}`,
      },
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(body);
          if (res.statusCode === 200) resolve(json);
          else reject(new Error(json.message || "Invalid Token"));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on("error", reject);
    req.end();
  });
}

async function main() {
  console.log("\n=======================================================");
  console.log(" 🚀 KakaoCord 원클릭 깃허브 생성 & 자동 푸시 시스템");
  console.log("=======================================================\n");

  // Check if GitHub CLI (gh) is available and logged in
  let useGhCli = false;
  try {
    const ghCheck = execSync("gh auth status", { stdio: "pipe" }).toString();
    if (ghCheck.includes("Logged in to")) {
      useGhCli = true;
      console.log("✔ GitHub CLI (gh) 로그인 상태 확인 완료!");
    }
  } catch {}

  let repoCloneUrl = "";
  let repoHtmlUrl = "";
  let repoName = "kakaocord-live";

  if (useGhCli) {
    console.log(`\nGitHub CLI를 사용하여 리포지토리 '${repoName}'을 자동 생성합니다...`);
    try {
      execSync(`gh repo create ${repoName} --public --source=. --remote=origin --push`, { stdio: "inherit" });
      const repoUrlOutput = execSync(`gh repo view --json url -q .url`).toString().trim();
      repoHtmlUrl = repoUrlOutput;
      repoCloneUrl = `${repoUrlOutput}.git`;
    } catch (e) {
      console.log("리포지토리가 이미 존재하거나 기본 생성을 계속 진행합니다.");
    }
  } else {
    console.log("GitHub API를 통해 리포지토리를 자동 생성하고 푸시합니다.\n");
    console.log("👉 GitHub Personal Access Token (classic, 'repo' 권한 체크 필요):");
    console.log("   (토큰이 없으시면 https://github.com/settings/tokens 에서 10초 만에 생성 가능합니다)\n");

    const tokenInput = await ask("GitHub Personal Access Token 입력: ");
    const token = tokenInput.trim();

    if (!token) {
      console.log("❌ 토큰이 입력되지 않았습니다. 취소합니다.");
      rl.close();
      return;
    }

    console.log("\n토큰 검증 중...");
    let user;
    try {
      user = await getAuthenticatedUser(token);
      console.log(`✔ GitHub 유저 확인: @${user.login} (${user.name || "User"})`);
    } catch (err) {
      console.error("❌ 유효하지 않은 GitHub 토큰입니다:", err.message);
      rl.close();
      return;
    }

    console.log(`\n리포지토리 '${repoName}' 생성 중...`);
    try {
      const repo = await createGitHubRepo(token, repoName);
      repoHtmlUrl = repo.html_url || `https://github.com/${user.login}/${repoName}`;
      repoCloneUrl = `https://${user.login}:${token}@github.com/${user.login}/${repoName}.git`;
      console.log(`✔ 저장소 준비 완료: ${repoHtmlUrl}`);
    } catch (err) {
      console.error("❌ 저장소 생성 오류:", err.message);
      rl.close();
      return;
    }

    // Git Init & Commit
    console.log("\n📦 Git 초기화 및 커밋 확인 중...");
    run("git -c safe.directory=* init", true);
    run("git -c safe.directory=* branch -M main", true);
    run("git -c safe.directory=* add .", true);
    run('git -c safe.directory=* commit -m "feat: complete KakaoCord fullstack application"', true);

    // Git Remote & Push
    console.log("\n🚀 GitHub 원격 저장소로 코드 푸시 중...");
    run("git -c safe.directory=* remote remove origin", true);
    run(`git -c safe.directory=* remote add origin ${repoCloneUrl}`, true);
    run("git -c safe.directory=* push -u origin main -f", false);
  }

  // Generate Vercel One-Click Deploy URL
  const vercelDeployUrl = `https://vercel.com/new/clone?repository-url=${encodeURIComponent(
    repoHtmlUrl
  )}&project-name=kakaocord&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY`;

  console.log("\n=======================================================");
  console.log(" 🎉 GitHub 리포지토리 생성 및 코드 푸시가 완료되었습니다!");
  console.log("=======================================================");
  console.log(`\n📌 내 GitHub 저장소: ${repoHtmlUrl}`);
  console.log(`\n🌐 Vercel 원클릭 배포 링크 (클릭 시 즉시 무료 배포 페이지로 이동):`);
  console.log(`   ${vercelDeployUrl}\n`);

  console.log("브라우저에서 Vercel 배포 페이지를 여시겠습니까? (Y/n)");
  const openBrowser = await ask("> ");
  if (openBrowser.toLowerCase() !== "n") {
    const startCmd = process.platform === "win32" ? "start" : process.platform === "darwin" ? "open" : "xdg-open";
    try {
      execSync(`${startCmd} "" "${vercelDeployUrl}"`);
    } catch {}
  }

  rl.close();
}

main().catch((err) => {
  console.error("\n❌ 오류 발생:", err);
  rl.close();
});
