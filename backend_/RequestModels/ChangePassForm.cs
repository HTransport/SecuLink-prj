namespace SecuLink.RequestModels
{
    public class ChangePassForm
    {
        public string OldPassword { get; set; }
        public string NewPassword { get; set; }
        public string Token { get; set; }
    }
}
