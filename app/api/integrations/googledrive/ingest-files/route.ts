import { NextRequest, NextResponse } from "next/server";
import {getLatestDriveCredential, refreshDriveAccessToken} from "@/app/api/integrations/googledrive/oauth";
import {getDriveCredentialByEmail} from "@/app/utlities/drive-sqlite-utils";
import {getFileContents} from "@/app/api/integrations/googledrive/ingest-files/index";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    const response = await request.json();
    try{
        const driveCreds = await getLatestDriveCredential(response.email);
        const headers = new Headers();
        headers.append("Content-Type", "application/json");
        headers.append("Authorization", "Bearer " + driveCreds[0].access_token);

        const params = new URLSearchParams({
            pageSize: "1",
        }).toString();
        const googleResponse = await fetch("https://www.googleapis.com/drive/v3/files?" + params, {
            method: "GET",
            headers: headers
        });
        const body = await googleResponse.json()
        console.log(body);

        for(const file of body.files){
            const contents = await getFileContents(file, response.email);
            console.log(contents);
        }

        if(googleResponse.status === 200) {
            return NextResponse.json(
                {status: 200},
            );
        } else {
            console.error("[Google Drive ingest files API]", body);
            return NextResponse.json(
                {error: (body as Error).message},
                {status: 500},
            );
        }

    }catch(error) {
        console.error("[Google Drive ingest files API]", error);
        return NextResponse.json(
            {error: (error as Error).message},
            {status: 500},
        );
    }
}